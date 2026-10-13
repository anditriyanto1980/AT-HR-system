import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  User,
  Info,
  Check,
  Smartphone,
  Eye,
  Lock,
  Sparkles,
  Upload,
  SwitchCamera,
  ChevronDown,
  ChevronUp,
  Building,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  AttendanceLocation,
  AttendanceRecord,
  Coordinates,
  Shift,
} from '../../types';
import {
  calculateDistanceMeters,
  formatDistance,
  getDeviceInfo,
} from '../../utils/geo';
import {
  evaluateClockInStatus,
  evaluateClockOut,
  formatDate,
  formatMinutes,
  formatTime,
} from '../../utils/attendance';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GoogleMapsCoordinateInput } from '../../components/common/GoogleMapsCoordinateInput';
import { getGoogleMapsUrl } from '../../utils/coordinateParser';

interface ClockInViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ClockInView: React.FC<ClockInViewProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();

  // Current live time ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AttendanceLocation | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  // Geolocation state
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(false);
  const [showGeofenceWarningModal, setShowGeofenceWarningModal] = useState<boolean>(false);
  const [showGpsHelpModal, setShowGpsHelpModal] = useState<boolean>(false);
  const [pendingActionType, setPendingActionType] = useState<'SHUTTER' | 'NATIVE_CAM' | null>(null);

  // Camera & Talenta Shutter state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);

  // Google Maps Coordinate Calibration State
  const [showEditCoordsModal, setShowEditCoordsModal] = useState(false);
  const [editBranchCoords, setEditBranchCoords] = useState<{
    latitude: number;
    longitude: number;
    radius_meters: number;
  }>({ latitude: -6.21462, longitude: 106.82155, radius_meters: 150 });
  const [coordSuccessToast, setCoordSuccessToast] = useState<string | null>(null);

  // Custom GPS Simulation from Google Maps State
  const [showCustomGpsModal, setShowCustomGpsModal] = useState(false);
  const [customGpsCoords, setCustomGpsCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: -6.21462, longitude: 106.82155 });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Action status feedback & Auto-redirect countdown
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(2);
  const [successResult, setSuccessResult] = useState<{
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    timeStr: string;
    photoUrl: string;
    statusText: string;
    lateMinutes?: number;
    durationMinutes?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load locations, shift, and existing today attendance
  useEffect(() => {
    loadData();
    requestGeolocation();

    // TALENTA BEHAVIOR: Auto-start live camera as soon as screen mounts!
    const autoCamTimer = setTimeout(() => {
      startCamera('user');
    }, 200);

    return () => {
      clearTimeout(autoCamTimer);
      stopCamera();
    };
  }, [currentUser]);

  // TALENTA AUTO-REDIRECT: Automatically return to Beranda after clock in / clock out succeeds
  useEffect(() => {
    if (!successResult) return;
    setCountdown(2);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      if (onNavigateTab) {
        onNavigateTab('dashboard');
      }
    }, 2000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [successResult, onNavigateTab]);

  const loadData = () => {
    if (!currentUser) return;
    const locs = dataService.getLocations();
    setLocations(locs);

    const matchedLoc =
      locs.find((l) => l.branch_id === currentUser.branch_id) || locs[0] || null;
    setSelectedLocation(matchedLoc);

    const sList = dataService.getShifts();
    setShifts(sList);
    const defaultShift = sList.find((s) => s.is_active) || sList[0] || null;
    setActiveShift(defaultShift);

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = dataService.getTodayAttendance(currentUser.id, todayStr);
    setTodayAttendance(existing || null);
  };

  const isClockedIn = Boolean(todayAttendance?.clock_in_time);
  const isClockedOut = Boolean(todayAttendance?.clock_out_time);

  // Geolocation handling
  const requestGeolocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Fitur Geolocation tidak didukung atau dinonaktifkan oleh browser Anda.');
      setGpsLoading(false);
      setUserCoords(null);
      setDistanceMeters(null);
      setIsInsideGeofence(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setUserCoords(coords);
        setGpsLoading(false);
        setGpsError(null);
        evaluateDistance(coords, selectedLocation);
      },
      (err) => {
        console.warn('GPS position error:', err.message);
        setGpsLoading(false);
        setUserCoords(null);
        setDistanceMeters(null);
        setIsInsideGeofence(false);

        let errorMsg = 'Lokasi GPS tidak terdeteksi. Pastikan GPS aktif dan izin lokasi telah disetujui.';
        if (err.code === 1) {
          errorMsg = 'Izin akses lokasi GPS ditolak oleh browser/pengguna. Silakan aktifkan izin lokasi di setelan browser.';
        } else if (err.code === 2) {
          errorMsg = 'Titik lokasi GPS tidak dapat diperoleh. Periksa jaringan internet dan pastikan GPS perangkat aktif.';
        } else if (err.code === 3) {
          errorMsg = 'Waktu permintaan lokasi GPS habis (timeout). Silakan klik Deteksi Ulang GPS.';
        }
        setGpsError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const evaluateDistance = (coords: Coordinates, loc: AttendanceLocation | null) => {
    if (!loc) return;
    const dist = calculateDistanceMeters(coords, {
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
    setDistanceMeters(dist);
    setIsInsideGeofence(dist <= loc.radius_meters);
  };

  useEffect(() => {
    if (userCoords && selectedLocation) {
      evaluateDistance(userCoords, selectedLocation);
    }
  }, [userCoords, selectedLocation]);

  const handleLocationChange = (loc: AttendanceLocation) => {
    setSelectedLocation(loc);
    if (userCoords) {
      evaluateDistance(userCoords, loc);
    }
  };

  const simulateCoordinates = (isInside: boolean) => {
    if (!selectedLocation) return;
    let newCoords: Coordinates;
    if (isInside) {
      newCoords = {
        latitude: selectedLocation.latitude + 0.00015,
        longitude: selectedLocation.longitude + 0.00015,
        accuracy: 10,
      };
    } else {
      // Simulate 2.8 km away outside geofence
      newCoords = {
        latitude: selectedLocation.latitude + 0.025,
        longitude: selectedLocation.longitude + 0.025,
        accuracy: 25,
      };
    }
    setUserCoords(newCoords);
    setGpsError(null);
    evaluateDistance(newCoords, selectedLocation);
  };

  const simulateGpsOff = () => {
    setUserCoords(null);
    setDistanceMeters(null);
    setIsInsideGeofence(false);
    setGpsError('Lokasi GPS tidak terdeteksi (Simulasi Pengujian: GPS Tidak Aktif).');
  };

  const handleOpenEditBranchCoords = () => {
    if (!selectedLocation) return;
    setEditBranchCoords({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      radius_meters: selectedLocation.radius_meters,
    });
    setShowEditCoordsModal(true);
  };

  const handleSaveBranchCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    dataService.updateLocationCoordinates(
      selectedLocation.id,
      editBranchCoords.latitude,
      editBranchCoords.longitude,
      editBranchCoords.radius_meters
    );

    const updatedLocs = dataService.getLocations();
    setLocations(updatedLocs);
    const updated = updatedLocs.find((l) => l.id === selectedLocation.id);
    if (updated) {
      setSelectedLocation(updated);
      if (userCoords) {
        evaluateDistance(userCoords, updated);
      }
    }

    setShowEditCoordsModal(false);
    setCoordSuccessToast(`Titik lokasi "${selectedLocation.name}" berhasil diperbarui dari Google Maps!`);
    setTimeout(() => setCoordSuccessToast(null), 5000);
  };

  const handleApplyCustomGps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    const coords: Coordinates = {
      latitude: customGpsCoords.latitude,
      longitude: customGpsCoords.longitude,
      accuracy: 10,
    };
    setUserCoords(coords);
    setGpsError(null);
    evaluateDistance(coords, selectedLocation);
    setShowCustomGpsModal(false);
    setCoordSuccessToast(`Simulasi GPS aktif: Lat ${coords.latitude.toFixed(6)}, Lng ${coords.longitude.toFixed(6)}`);
    setTimeout(() => setCoordSuccessToast(null), 5000);
  };

  // =========================================================================
  // CAMERA ENGINE (TALENTA STYLE INSTANT WEBRTC + PROGRESSIVE MOBILE FALLBACK)
  // Fixes Mobile Black Screen: avoids portrait/landscape mismatch constraints
  // =========================================================================
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setCameraLoading(true);
    setIsStreamActive(false);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser HP tidak mendukung WebRTC. Silakan gunakan tombol "Buka Kamera Bawaan HP" di bawah.'
        );
        setCameraLoading(false);
        return;
      }

      // Constraints optimized for mobile phones (avoids rigid width/height mismatch that causes black screen)
      const constraintCandidates: MediaStreamConstraints[] = [
        // 1. Natural mobile facing mode (allows device HAL to pick native portrait resolution)
        {
          video: {
            facingMode: mode,
          },
          audio: false,
        },
        // 2. Soft ideal facing mode
        {
          video: {
            facingMode: { ideal: mode },
          },
          audio: false,
        },
        // 3. Mobile portrait resolution preference
        {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 720 },
            height: { ideal: 1280 },
          },
          audio: false,
        },
        // 4. Fallback to any active video sensor
        {
          video: true,
          audio: false,
        },
      ];

      let activeStream: MediaStream | null = null;
      let lastErr: any = null;

      for (const c of constraintCandidates) {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia(c);
          if (activeStream) break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!activeStream) {
        console.warn('Could not acquire camera stream with any constraint:', lastErr);
        setCameraError(
          'Kamera langsung diblokir atau gagal merender di browser HP. Silakan klik tombol "Buka Kamera Bawaan HP" di bawah.'
        );
        setCameraActive(false);
        setCameraLoading(false);
        return;
      }

      streamRef.current = activeStream;
      setCameraActive(true);

      // Immediately connect to video element with critical mobile attributes
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = activeStream;
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;
        (video as any).webkitPlaysinline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('autoplay', 'true');

        const triggerPlay = () => {
          video
            .play()
            .then(() => {
              setIsStreamActive(true);
            })
            .catch((err) => {
              console.warn('Direct video.play() deferred:', err);
            });
        };

        video.onloadedmetadata = () => triggerPlay();
        video.oncanplay = () => triggerPlay();
        triggerPlay();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Akses kamera ditolak atau tidak dapat diaktifkan. Silakan gunakan tombol "Buka Kamera Bawaan HP" di bawah.'
      );
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStreamActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Sync stream when cameraActive becomes true
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      (video as any).webkitPlaysinline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');

      video
        .play()
        .then(() => setIsStreamActive(true))
        .catch((err) => console.warn('useEffect playback catch:', err));
    }
  }, [cameraActive, facingMode]);

  // =========================================================================
  // =========================================================================
  // TALENTA 1-TAP SHUTTER & DIRECT SUBMIT WITH GEOFENCE/GPS WARNING INTERCEPT
  // =========================================================================
  const handleShutterClick = async (forceProceed = false) => {
    if (submitting) return;

    // Check if GPS is not detected or location is outside geofencing radius
    const isGpsMissing = !userCoords;
    const isOutside = !isInsideGeofence;

    if (!forceProceed && (isGpsMissing || isOutside)) {
      setPendingActionType('SHUTTER');
      setShowGeofenceWarningModal(true);
      return;
    }

    // Trigger visual shutter flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    // If video feed is not active or has 0 dimensions, gracefully launch native camera
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      fileInputRef.current?.click();
      return;
    }

    // 1. Capture live frame from video element
    let photoDataUrl: string | null = null;

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Add Official HR Verification Watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        const now = new Date();
        const modeLabel = !isClockedIn ? 'CLOCK IN (LIVE SELFIE)' : 'CLOCK OUT (LIVE SELFIE)';
        const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB | ${modeLabel}`;
        ctx.fillText(timeStr, 14, canvas.height - 26);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = !isInsideGeofence ? '#FBBF24' : '#6EE7B7';
        const locStatus = !userCoords ? 'GPS: Tidak Terdeteksi' : !isInsideGeofence ? `LUAR RADIUS (${formatDistance(distanceMeters || 0)})` : 'RADIUS OK';
        const locStr = `📍 ${selectedLocation?.name || 'Kantor'} [${locStatus}] • ${currentUser?.full_name || 'Staff'}`;
        ctx.fillText(locStr, 14, canvas.height - 8);

        photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (err) {
      console.warn('Canvas capture error:', err);
    }

    // Fallback if frame could not be extracted
    if (!photoDataUrl) {
      fileInputRef.current?.click();
      return;
    }

    // Stop camera and immediately submit attendance
    stopCamera();
    await executeAttendanceSubmit(photoDataUrl);
  };

  const handleOpenNativeCamera = () => {
    const isGpsMissing = !userCoords;
    const isOutside = !isInsideGeofence;

    if (isGpsMissing || isOutside) {
      setPendingActionType('NATIVE_CAM');
      setShowGeofenceWarningModal(true);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleConfirmProceedAttendance = () => {
    setShowGeofenceWarningModal(false);
    if (pendingActionType === 'SHUTTER') {
      handleShutterClick(true);
    } else if (pendingActionType === 'NATIVE_CAM') {
      fileInputRef.current?.click();
    }
  };

  // Process native mobile camera snapshot
  const handleDeviceCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 640;
        canvas.height = img.height || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Watermark
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          const now = new Date();
          const modeLabel = !isClockedIn ? 'CLOCK IN (HP CAMERA)' : 'CLOCK OUT (HP CAMERA)';
          const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB | ${modeLabel}`;
          ctx.fillText(timeStr, 14, canvas.height - 26);
          ctx.font = '11px sans-serif';
          ctx.fillStyle = !isInsideGeofence ? '#FBBF24' : '#6EE7B7';
          const locStatus = !userCoords ? 'GPS: Tidak Terdeteksi' : !isInsideGeofence ? `LUAR RADIUS (${formatDistance(distanceMeters || 0)})` : 'RADIUS OK';
          const locStr = `📍 ${selectedLocation?.name || 'Kantor'} [${locStatus}] • ${currentUser?.full_name || 'Staff'}`;
          ctx.fillText(locStr, 14, canvas.height - 8);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          stopCamera();
          executeAttendanceSubmit(dataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Direct Attendance Submission (Clock In or Out)
  const executeAttendanceSubmit = async (photoUrl: string) => {
    if (!currentUser) return;
    setSubmitting(true);
    setErrorMessage(null);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const isOutside = !isInsideGeofence || !userCoords;

    if (!isClockedIn) {
      // Execute CLOCK IN
      const shift = activeShift || shifts[0];
      const { status, lateMinutes } = evaluateClockInStatus(now, shift);

      const recordNotes = !userCoords
        ? 'Presensi tanpa sinyal GPS (Di luar radius / Menunggu Persetujuan Atasan)'
        : !isInsideGeofence
        ? `Presensi di luar radius kantor (${formatDistance(distanceMeters || 0)}) - Menunggu Persetujuan Atasan`
        : lateMinutes > 0
        ? `Terlambat ${lateMinutes} menit`
        : 'Clock In Tepat Waktu';

      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employee_id: currentUser.id,
        shift_id: shift?.id || 'shift-01',
        attendance_date: todayStr,
        clock_in_time: now.toISOString(),
        clock_in_lat: userCoords?.latitude,
        clock_in_lng: userCoords?.longitude,
        clock_in_accuracy: userCoords?.accuracy,
        clock_in_distance_meters: distanceMeters ?? 0,
        clock_in_location_name: selectedLocation?.name || 'Kantor',
        clock_in_device: getDeviceInfo(),
        clock_in_selfie_url: photoUrl,
        clock_in_status: status,
        late_minutes: lateMinutes,
        early_checkout_minutes: 0,
        work_duration_minutes: 0,
        overtime_minutes: 0,
        is_outside_geofence: isOutside,
        approval_status: isOutside ? 'PENDING' : 'APPROVED',
        notes: recordNotes,
      };

      dataService.saveAttendance(record);
      dataService.logAudit({
        user_name: currentUser.full_name,
        action: 'CLOCK_IN',
        module: 'ATTENDANCE',
        record_id: record.id,
        after_data: { status, lateMinutes, distance: distanceMeters, isOutside, hasPhoto: true },
      });

      setTodayAttendance(record);
      setSubmitting(false);
      setSuccessResult({
        type: 'CLOCK_IN',
        timeStr: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        photoUrl,
        statusText: isOutside
          ? `Luar Radius (${formatDistance(distanceMeters || 0)}) - Menunggu Approval`
          : status === 'present'
          ? 'Tepat Waktu'
          : `Terlambat ${lateMinutes}m`,
        lateMinutes,
      });
    } else {
      // Execute CLOCK OUT
      const clockInTime = new Date(todayAttendance!.clock_in_time!);
      const { workDurationMinutes, earlyCheckoutMinutes, overtimeMinutes } = evaluateClockOut(
        clockInTime,
        now,
        activeShift || undefined
      );

      const updated: AttendanceRecord = {
        ...todayAttendance!,
        clock_out_time: now.toISOString(),
        clock_out_lat: userCoords?.latitude,
        clock_out_lng: userCoords?.longitude,
        clock_out_accuracy: userCoords?.accuracy,
        clock_out_distance_meters: distanceMeters ?? 0,
        clock_out_location_name: selectedLocation?.name || 'Kantor',
        clock_out_device: getDeviceInfo(),
        clock_out_selfie_url: photoUrl,
        work_duration_minutes: workDurationMinutes,
        early_checkout_minutes: earlyCheckoutMinutes,
        overtime_minutes: overtimeMinutes,
        is_outside_geofence: isOutside || Boolean(todayAttendance!.is_outside_geofence),
      };

      dataService.saveAttendance(updated);
      dataService.logAudit({
        user_name: currentUser.full_name,
        action: 'CLOCK_OUT',
        module: 'ATTENDANCE',
        record_id: updated.id,
        after_data: { durationMinutes: workDurationMinutes, overtimeMinutes, isOutside, hasPhoto: true },
      });

      setTodayAttendance(updated);
      setSubmitting(false);
      setSuccessResult({
        type: 'CLOCK_OUT',
        timeStr: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        photoUrl,
        statusText: `Total Jam Kerja: ${formatMinutes(workDurationMinutes)}${isOutside ? ' (Luar Radius)' : ''}`,
        durationMinutes: workDurationMinutes,
      });
    }
  };

  // Sandbox simulation test
  const handleSimulateShutter = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 480, 360);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 360);

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(240, 140, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(240, 260, 90, 60, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 310, 480, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${currentUser?.full_name || 'Staff'} | ${new Date().toLocaleString('id-ID')}`, 16, 335);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    executeAttendanceSubmit(dataUrl);
  };

  // =========================================================================
  // VIEW: IF ALREADY COMPLETED FOR TODAY
  // =========================================================================
  if (isClockedOut && !successResult) {
    return (
      <div className="max-w-md mx-auto space-y-4 p-2 sm:p-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Hari Ini Selesai
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Presensi Telah Lengkap!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Anda telah melakukan absen masuk dan absen pulang hari ini.
            </p>
          </div>

          {/* Side-by-side verification photos */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Foto Masuk (In)
              </span>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                {todayAttendance?.clock_in_selfie_url ? (
                  <img
                    src={todayAttendance.clock_in_selfie_url}
                    alt="Foto Masuk"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-slate-800 font-mono">
                {formatTime(todayAttendance?.clock_in_time)} WIB
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Foto Pulang (Out)
              </span>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                {todayAttendance?.clock_out_selfie_url ? (
                  <img
                    src={todayAttendance.clock_out_selfie_url}
                    alt="Foto Pulang"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-slate-800 font-mono">
                {formatTime(todayAttendance?.clock_out_time)} WIB
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Total Waktu Kerja:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatMinutes(todayAttendance?.work_duration_minutes || 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('dashboard')}
            className="w-full py-3.5 bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: SUCCESS DIALOG (TALENTA AUTO-RETURN TO BERANDA)
  // =========================================================================
  if (successResult) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              {successResult.type === 'CLOCK_IN' ? 'Clock In Berhasil' : 'Clock Out Berhasil'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Presensi Berhasil Direkam!
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 font-mono">
              Pukul {successResult.timeStr} WIB • {successResult.statusText}
            </p>
          </div>

          {/* Captured selfie verification preview */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500 max-w-xs mx-auto">
            <img
              src={successResult.photoUrl}
              alt="Verifikasi Presensi"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-emerald-950/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>LIVE PHOTO VERIFIED</span>
            </div>
          </div>

          {/* Auto return countdown message and animated progress bar */}
          <div className="bg-blue-50/90 rounded-2xl p-3.5 border border-blue-100 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span>Otomatis kembali ke Beranda dalam {countdown} detik...</span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, ((3 - countdown) / 2) * 100))}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccessResult(null);
              if (onNavigateTab) {
                onNavigateTab('dashboard');
              }
            }}
            className="w-full py-3.5 bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Kembali ke Beranda Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TALENTA LIVE CAMERA ATTENDANCE VIEWPORT
  // =========================================================================
  const attendanceMode = !isClockedIn ? 'CLOCK_IN' : 'CLOCK_OUT';

  return (
    <div className="max-w-md mx-auto space-y-3.5 pb-6">
      {/* TALENTA HEADER: Clock In / Clock Out Mode Banner with Back Arrow */}
      <div className="bg-[#0B1528] rounded-2xl p-3 text-white flex items-center justify-between shadow-lg border border-slate-800">
        <div className="flex items-center gap-2">
          {/* Back button to Beranda */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onNavigateTab?.('dashboard');
            }}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              attendanceMode === 'CLOCK_IN' ? 'bg-[#1D63FF]' : 'bg-rose-600'
            }`}
          >
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>{attendanceMode === 'CLOCK_IN' ? 'Clock In (Masuk)' : 'Clock Out (Pulang)'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} •{' '}
              <b className="text-white">{currentTime.toLocaleTimeString('id-ID')} WIB</b>
            </div>
          </div>
        </div>

        {/* GPS Distance Badge */}
        <div className="text-right">
          <div
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              !userCoords
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : isInsideGeofence
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>{!userCoords ? 'GPS Belum Aktif' : isInsideGeofence ? 'Radius OK' : 'Luar Radius'}</span>
          </div>
          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
            {!userCoords ? 'Titik Tidak Terdeteksi' : distanceMeters !== null ? formatDistance(distanceMeters) : 'GPS...'}
          </div>
        </div>
      </div>

      {/* 1. GPS LOADING BANNER */}
      {gpsLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center gap-2.5 text-xs shadow-xs animate-in fade-in duration-200">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold">Mendeteksi Titik GPS...</span>
            <p className="text-[11px] text-blue-700">Mencari koordinat satelit akurat perangkat Anda untuk verifikasi radius kantor.</p>
          </div>
        </div>
      )}

      {/* 2. WARNING BANNER: GPS TIDAK TERDETEKSI */}
      {!gpsLoading && (!userCoords || gpsError) && (
        <div className="p-4 bg-gradient-to-br from-rose-50 via-rose-50/90 to-amber-50 border-2 border-rose-300 rounded-2xl shadow-sm text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-rose-950 text-xs sm:text-sm">
                  Peringatan: Lokasi GPS Tidak Terdeteksi!
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider shrink-0">
                  GPS Belum Aktif
                </span>
              </div>
              <p className="text-rose-800 text-[11px] font-medium leading-relaxed mt-1">
                {gpsError || 'Titik koordinat satelit GPS perangkat Anda tidak ditemukan. Sistem memerlukan lokasi GPS untuk memverifikasi zona presensi kantor.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/80">
            <button
              type="button"
              onClick={requestGeolocation}
              disabled={gpsLoading}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>Deteksi Ulang GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGpsHelpModal(true)}
              className="px-3 py-1.5 bg-white hover:bg-rose-100/60 text-rose-800 font-semibold rounded-xl text-xs border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-rose-600" />
              <span>Petunjuk Izin GPS</span>
            </button>

            <button
              type="button"
              onClick={() => simulateCoordinates(true)}
              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-[11px] border border-amber-300 ml-auto transition-all cursor-pointer"
              title="Simulasi lokasi di dalam kantor untuk testing"
            >
              Simulasi Lokasi Kantor
            </button>
          </div>
        </div>
      )}

      {/* 3. WARNING BANNER: DI LUAR ZONA GEOFENCING */}
      {!gpsLoading && userCoords && !isInsideGeofence && (
        <div className="p-4 bg-gradient-to-br from-amber-50 via-amber-50/90 to-orange-50 border-2 border-amber-400 rounded-2xl shadow-sm text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-amber-950 text-xs sm:text-sm">
                  Peringatan: Anda Berada di Luar Radius Kantor!
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 uppercase tracking-wider shrink-0">
                  Luar Radius
                </span>
              </div>
              <p className="text-amber-900 text-[11px] font-medium leading-relaxed mt-1">
                Posisi Anda berjarak <strong className="text-rose-700 font-black">{distanceMeters !== null ? formatDistance(distanceMeters) : ''}</strong> dari lokasi <strong>{selectedLocation?.name}</strong>. Batas radius kantor yang diizinkan adalah <strong>{selectedLocation?.radius_meters} meter</strong>.
              </p>
            </div>
          </div>

          {/* Metric comparison strip */}
          <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Radius Diizinkan:</span>
              <span className="font-bold text-slate-800">{selectedLocation?.radius_meters} meter</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Jarak Anda Sekarang:</span>
              <span className="font-black text-rose-600 font-mono">
                {distanceMeters !== null ? formatDistance(distanceMeters) : '-'} (+{distanceMeters ? Math.max(0, Math.round(distanceMeters - (selectedLocation?.radius_meters || 0))) : 0}m)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Absensi tetap dapat disimpan dan otomatis masuk antrean <b>Approval Manajer</b>.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleOpenEditBranchCoords}
                className="font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                title="Bisa copy paste koordinat dari Google Maps jika titik kantor kurang akurat"
              >
                <MapPin className="w-3 h-3 text-amber-800" />
                <span>Update Titik Kantor (Google Maps)</span>
              </button>
              <button
                type="button"
                onClick={requestGeolocation}
                className="font-bold text-amber-950 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Segarkan GPS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR BANNER IF ANY */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] text-rose-600 hover:underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TALENTA VIEWFINDER CONTAINER: LIVE CAMERA STREAM WITH FACIAL GUIDELINE    */}
      {/* ========================================================================= */}
      <div className="relative aspect-[3/4] max-w-sm mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800">
        {/* Flash Effect on shutter capture */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
        )}

        {/* ALWAYS-MOUNTED VIDEO ELEMENT */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlaying={() => setIsStreamActive(true)}
          onTimeUpdate={() => {
            if (!isStreamActive && videoRef.current && videoRef.current.videoWidth > 0) {
              setIsStreamActive(true);
            }
          }}
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'transform -scale-x-100' : ''
          }`}
        />

        {/* TALENTA FACIAL ALIGNMENT OVAL OVERLAY */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
          <div className="w-56 h-72 border-2 border-dashed border-white/60 rounded-[90px] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-white/90 bg-slate-950/60 px-3 py-1 rounded-full backdrop-blur-xs tracking-wide">
              Posisikan Wajah di Sini
            </span>
          </div>
        </div>

        {/* CAMERA LOADING SPINNER */}
        {cameraLoading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2 z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <span className="font-bold">Membuka Kamera Live...</span>
          </div>
        )}

        {/* BLACK SCREEN RESCUE OVERLAY (If stream not yet rendering on mobile HP) */}
        {!cameraLoading && !isStreamActive && cameraActive && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-center p-5 z-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Memuat Gambar Kamera HP...</h4>
              <p className="text-[11px] text-slate-300 mt-1 max-w-[240px]">
                Jika layar HP tetap hitam, klik tombol di bawah untuk menggunakan kamera HP langsung:
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNativeCamera}
              className="px-4 py-2 rounded-xl bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Buka Kamera HP (1 Klik)</span>
            </button>
          </div>
        )}

        {/* TOP CONTROLS INSIDE CAMERA: Switch Camera Button & Geofence Pin */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-20">
          <div className="space-y-1.5 max-w-[210px]">
            <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium border border-white/10 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${userCoords && isInsideGeofence ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-pulse'}`} />
              <span className="truncate">{selectedLocation?.name.split(' - ')[0] || 'Kantor'}</span>
            </div>

            {/* LIVE CAMERA WARNING OVERLAY PILL */}
            {!userCoords ? (
              <div className="bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse border border-rose-400/80">
                <ShieldAlert className="w-3 h-3 text-white shrink-0" />
                <span className="truncate">GPS Belum Terdeteksi</span>
              </div>
            ) : !isInsideGeofence ? (
              <div className="bg-amber-500/95 backdrop-blur-xs text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-amber-300">
                <AlertTriangle className="w-3 h-3 text-slate-950 shrink-0" />
                <span className="truncate">Luar Radius ({distanceMeters !== null ? formatDistance(distanceMeters) : ''})</span>
              </div>
            ) : (
              <div className="bg-emerald-600/85 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-emerald-400/40">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
                <span>Radius Terverifikasi</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="w-9 h-9 rounded-full bg-slate-950/75 hover:bg-slate-900 backdrop-blur-md text-white border border-white/15 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
              title="Segarkan Kamera"
            >
              <RefreshCw className="w-4 h-4 text-blue-300" />
            </button>

            <button
              type="button"
              onClick={toggleFacingMode}
              className="w-9 h-9 rounded-full bg-slate-950/75 hover:bg-slate-900 backdrop-blur-md text-white border border-white/15 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
            >
              <SwitchCamera className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>

        {/* BOTTOM METADATA WATERMARK OVERLAY */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-white text-[10px] font-mono z-20 flex items-center justify-between">
          <div className="truncate min-w-0 pr-2">
            <div className="font-bold text-amber-400 truncate">
              {currentUser?.full_name} • {currentUser?.employee_code || 'EMP'}
            </div>
            <div className="text-[9px] text-slate-300">
              Shift: {activeShift?.name || 'Reguler'} ({activeShift?.start_time} - {activeShift?.end_time})
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-emerald-400 font-bold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TALENTA BIG SHUTTER BUTTON: 1-CLICK AMBIL FOTO & SELESAI ABSEN             */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-1">
        <button
          type="button"
          onClick={() => handleShutterClick(false)}
          disabled={submitting}
          className={`w-full py-4 px-6 rounded-2xl text-sm font-black tracking-wide text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 ${
            attendanceMode === 'CLOCK_IN'
              ? 'bg-gradient-to-r from-[#1D63FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/35'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/35'
          }`}
        >
          {/* Circular shutter camera icon */}
          <div className="w-7 h-7 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
          </div>
          <div className="flex flex-col items-center leading-tight">
            <span>
              {submitting
                ? 'MEREKAM ABSENSI...'
                : attendanceMode === 'CLOCK_IN'
                ? 'AMBIL FOTO & CLOCK IN'
                : 'AMBIL FOTO & CLOCK OUT'}
            </span>
            {!userCoords ? (
              <span className="text-[10px] text-rose-200 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldAlert className="w-3 h-3 text-rose-300 shrink-0" />
                <span>GPS Belum Terdeteksi (Perlu Konfirmasi)</span>
              </span>
            ) : !isInsideGeofence ? (
              <span className="text-[10px] text-amber-200 font-semibold flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                <span>Di Luar Radius (+{distanceMeters ? Math.max(0, Math.round(distanceMeters - (selectedLocation?.radius_meters || 0))) : 0}m) • Butuh Approval</span>
              </span>
            ) : null}
          </div>
        </button>

        {/* 100% RELIABLE FALLBACK: NATIVE MOBILE DEVICE CAMERA */}
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleOpenNativeCamera}
            className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka Kamera Bawaan HP</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            type="button"
            onClick={handleSimulateShutter}
            className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
          >
            Simulasi Foto (Testing)
          </button>
        </div>

        {/* Hidden file input for native device camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleDeviceCameraCapture}
          className="hidden"
        />
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSIBLE SHIFT & LOCATION ADJUSTMENT (For Testing / Special Shifts)    */}
      {/* ========================================================================= */}
      <div className="pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowLocationSettings(!showLocationSettings)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 py-1 font-medium cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Pengaturan Lokasi Cabang, Shift & Simulasi GPS</span>
          </span>
          {showLocationSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLocationSettings && (
          <div className="mt-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Lokasi Kantor (Cabang)
              </label>
              <select
                value={selectedLocation?.id || ''}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) handleLocationChange(found);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} (Radius: {loc.radius_meters}m)
                  </option>
                ))}
              </select>

              {/* Branch location coordinate preview & Google Maps update trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                <div className="text-slate-600 font-mono flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {selectedLocation
                      ? `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)} (Radius: ${selectedLocation.radius_meters}m)`
                      : 'Belum ada lokasi'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedLocation && (
                    <a
                      href={getGoogleMapsUrl(selectedLocation.latitude, selectedLocation.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <span>Lihat Peta</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenEditBranchCoords}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Update dari Google Maps</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Shift Kerja
              </label>
              <select
                value={activeShift?.id || ''}
                onChange={(e) => {
                  const found = shifts.find((s) => s.id === e.target.value);
                  if (found) setActiveShift(found);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Simulation buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold">Simulasi Pengujian Lokasi:</span>
                <button
                  type="button"
                  onClick={requestGeolocation}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>GPS Asli</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => simulateCoordinates(true)}
                  className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-center cursor-pointer transition-colors"
                >
                  ✓ Di Dalam Kantor
                </button>
                <button
                  type="button"
                  onClick={() => simulateCoordinates(false)}
                  className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-center cursor-pointer transition-colors"
                >
                  ⚠️ Luar Radius
                </button>
                <button
                  type="button"
                  onClick={simulateGpsOff}
                  className="py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 text-center cursor-pointer transition-colors"
                >
                  ✕ GPS Mati
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLocation) {
                      setCustomGpsCoords({
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      });
                    }
                    setShowCustomGpsModal(true);
                  }}
                  className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 text-center cursor-pointer transition-colors"
                  title="Paste koordinat Google Maps untuk simulasi posisi GPS Anda"
                >
                  🎯 Paste GPS Kustom
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PERINGATAN GEOFENCING / GPS BELUM TERDETEKSI                         */}
      {/* ========================================================================= */}
      {showGeofenceWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-5 text-white ${!userCoords ? 'bg-gradient-to-r from-rose-600 to-rose-700' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                  {!userCoords ? (
                    <ShieldAlert className="w-6 h-6 text-white" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight leading-snug">
                    {!userCoords
                      ? 'Peringatan: GPS Tidak Terdeteksi'
                      : 'Peringatan: Di Luar Radius Kantor'}
                  </h3>
                  <p className="text-[11px] text-white/85 mt-0.5">
                    {!userCoords
                      ? 'Titik koordinat perangkat belum dapat diverifikasi'
                      : 'Lokasi Anda berada di luar area yang diizinkan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Location Metric Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Kantor Cabang:</span>
                  <span className="font-bold text-slate-800">{selectedLocation?.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Batas Radius Diizinkan:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedLocation?.radius_meters} meter</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                  <span>Jarak Posisi Anda:</span>
                  <span className={`font-black font-mono ${!userCoords ? 'text-rose-600' : 'text-amber-600'}`}>
                    {!userCoords ? 'Tidak Terdeteksi (GPS Non-Aktif)' : formatDistance(distanceMeters || 0)}
                  </span>
                </div>
              </div>

              {/* Policy explanation */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Kebijakan Presensi Di Luar Radius:</span>
                </div>
                <p>
                  {!userCoords
                    ? 'Absensi tanpa sinyal koordinat GPS akan secara otomatis dicatat dengan tanda "Luar Radius" dan membutuhkan persetujuan (approval) atasan/HR.'
                    : `Jarak Anda melebihi batas radius kantor sejauh +${distanceMeters ? Math.max(0, Math.round(distanceMeters - (selectedLocation?.radius_meters || 0))) : 0} meter. Presensi akan otomatis masuk ke antrean Pusat Persetujuan Manajer.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmProceedAttendance}
                  className={`w-full py-3 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                    !userCoords
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25 text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Tetap Lanjutkan &amp; Ambil Foto Selfie</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGeofenceWarningModal(false);
                    requestGeolocation();
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Batal &amp; Periksa Titik Lokasi Kembali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PANDUAN IZIN LOKASI GPS                                              */}
      {/* ========================================================================= */}
      {showGpsHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Petunjuk Mengaktifkan GPS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGpsHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Android (Google Chrome):
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Ketuk ikon gembok / tombol setelan di samping alamat web di browser.<br />
                  2. Pilih <b>Izin Situs (Permissions)</b> &gt; <b>Lokasi</b>.<br />
                  3. Ubah menjadi <b>Izinkan (Allow)</b> dan pastikan GPS HP aktif.
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-900" />
                  iPhone / iPad (Safari):
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Buka <b>Pengaturan HP</b> &gt; <b>Privasi &amp; Keamanan</b> &gt; <b>Layanan Lokasi</b>.<br />
                  2. Pastikan Layanan Lokasi <b>Aktif</b>.<br />
                  3. Gulir ke <b>Situs Web Safari</b> dan pilih <b>Saat Menggunakan App</b>.
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  Komputer Laptop (Chrome/Edge):
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Klik ikon setelan / gembok di sebelah kiri URL pada address bar browser.<br />
                  2. Aktifkan sakelar <b>Lokasi (Location)</b> ke posisi <b>Aktif</b>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGpsHelpModal(false);
                  requestGeolocation();
                }}
                className="w-full py-3 bg-[#1D63FF] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/25"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tutup &amp; Segarkan GPS Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL UPDATE TITIK KOORDINAT CABANG (GOOGLE MAPS)                         */}
      {/* ========================================================================= */}
      {showEditCoordsModal && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Update Titik Lokasi Kantor</h3>
                  <p className="text-[10px] text-slate-400">{selectedLocation.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCoordsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBranchCoordinates} className="p-5 space-y-4">
              <GoogleMapsCoordinateInput
                latitude={editBranchCoords.latitude}
                longitude={editBranchCoords.longitude}
                onChange={(lat, lng) =>
                  setEditBranchCoords((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                }
                radiusMeters={editBranchCoords.radius_meters}
                onChangeRadius={(r) =>
                  setEditBranchCoords((prev) => ({ ...prev, radius_meters: r }))
                }
                showRadius={true}
                label="Titik Koordinat Baru dari Google Maps"
                helperText="Copy titik koordinat dari Google Maps (misal: -6.2087634, 106.845599) lalu paste di sini atau gunakan tombol Tempel dari Clipboard."
              />

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCoordsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan &amp; Terapkan Titik Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SIMULASI TITIK GPS KUSTOM (GOOGLE MAPS)                              */}
      {/* ========================================================================= */}
      {showCustomGpsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Simulasi Posisi GPS (Google Maps)</h3>
                  <p className="text-[10px] text-slate-400">Uji titik lokasi kustom terhadap radius kantor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomGpsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyCustomGps} className="p-5 space-y-4">
              <GoogleMapsCoordinateInput
                latitude={customGpsCoords.latitude}
                longitude={customGpsCoords.longitude}
                onChange={(lat, lng) => setCustomGpsCoords({ latitude: lat, longitude: lng })}
                showRadius={false}
                label="Titik GPS Perangkat yang Ingin Diuji"
                helperText="Paste koordinat dari Google Maps untuk mensimulasikan posisi GPS Anda dan mengecek apakah masuk radius kantor."
              />

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomGpsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Terapkan Titik GPS Pengujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Notification Toast */}
      {coordSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold">Koordinat Diperbarui</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{coordSuccessToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};
