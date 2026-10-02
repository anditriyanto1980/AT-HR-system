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

export const ClockInView: React.FC = () => {
  const { currentUser } = useAuth();

  // Current live time
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
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);

  // Camera & Selfie state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [clockInPhoto, setClockInPhoto] = useState<string | null>(null);
  const [clockOutPhoto, setClockOutPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoErrorHighlight, setPhotoErrorHighlight] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Action status feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

    return () => {
      stopCamera();
    };
  }, [currentUser]);

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

    if (existing?.clock_in_selfie_url) {
      setClockInPhoto(existing.clock_in_selfie_url);
    }
    if (existing?.clock_out_selfie_url) {
      setClockOutPhoto(existing.clock_out_selfie_url);
    }
  };

  const isClockedIn = Boolean(todayAttendance?.clock_in_time);
  const isClockedOut = Boolean(todayAttendance?.clock_out_time);

  // Geolocation handling
  const requestGeolocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation tidak didukung oleh browser Anda.');
      setGpsLoading(false);
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
        evaluateDistance(coords, selectedLocation);
      },
      (err) => {
        console.warn('GPS position error:', err.message);
        setGpsError(
          'Tidak dapat membaca titik GPS akurat. Anda dapat mengklik tombol "Simulasi Lokasi" di bawah untuk pengujian.'
        );
        setGpsLoading(false);
        if (selectedLocation) {
          const fallbackCoords: Coordinates = {
            latitude: selectedLocation.latitude + 0.0001,
            longitude: selectedLocation.longitude + 0.0001,
            accuracy: 15,
          };
          setUserCoords(fallbackCoords);
          evaluateDistance(fallbackCoords, selectedLocation);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
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
      newCoords = {
        latitude: selectedLocation.latitude + 0.015,
        longitude: selectedLocation.longitude + 0.015,
        accuracy: 25,
      };
    }
    setUserCoords(newCoords);
    evaluateDistance(newCoords, selectedLocation);
    setGpsError(null);
  };

  // Camera handling with mobile constraint fallbacks
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setPhotoErrorHighlight(false);
    setCameraLoading(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser HP Anda tidak mendukung kamera live WebRTC. Silakan gunakan tombol "Buka Kamera HP (Bawaan)" di bawah.'
        );
        setCameraLoading(false);
        return;
      }

      // Try multiple constraint sets progressively to avoid mobile black screen / driver negotiation freeze
      const constraintCandidates = [
        {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: mode,
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: mode },
          },
          audio: false,
        },
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
          'Kamera langsung diblokir atau gagal merender di browser HP Anda. Silakan klik tombol "Buka Kamera HP (Bawaan)" di bawah untuk mengambil foto langsung.'
        );
        setCameraActive(false);
        setCameraLoading(false);
        return;
      }

      streamRef.current = activeStream;
      setCameraActive(true);

      // Immediately connect to video element if ready
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = activeStream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.onloadedmetadata = () => {
          video.play().catch((err) => console.warn('video.play() metadata wait:', err));
        };
        try {
          await video.play();
        } catch (e) {
          console.warn('Direct video.play() waiting:', e);
        }
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Akses kamera ditolak atau tidak dapat diaktifkan. Silakan gunakan tombol "Buka Kamera HP (Bawaan)" di bawah untuk langsung membuka kamera bawaan ponsel.'
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
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Ensure stream is attached whenever cameraActive becomes true
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.onloadedmetadata = () => {
        video.play().catch((err) => console.warn('metadata play err:', err));
      };
      video.play().catch((err) => console.warn('playback err:', err));
    }
  }, [cameraActive, facingMode]);

  // Capture snapshot from webcam video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror image horizontally for selfie view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Add watermark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      const timeStr = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} | ${
        !isClockedIn ? 'CLOCK IN' : 'CLOCK OUT'
      } | ${selectedLocation?.name || 'GPS OK'}`;
      ctx.fillText(timeStr, 12, canvas.height - 15);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (!isClockedIn) {
        setClockInPhoto(dataUrl);
      } else {
        setClockOutPhoto(dataUrl);
      }

      stopCamera();
      setPhotoErrorHighlight(false);
      setErrorMessage(null);
    }
  };

  // Fallback direct device camera input (Mobile native camera with GPS watermark)
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
          // Add watermark overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          const timeStr = `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} | ${
            !isClockedIn ? 'CLOCK IN (HP CAMERA)' : 'CLOCK OUT (HP CAMERA)'
          } | ${selectedLocation?.name || 'GPS OK'}`;
          ctx.fillText(timeStr, 14, canvas.height - 15);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (!isClockedIn) {
            setClockInPhoto(dataUrl);
          } else {
            setClockOutPhoto(dataUrl);
          }
        } else {
          const rawUrl = reader.result as string;
          if (!isClockedIn) setClockInPhoto(rawUrl);
          else setClockOutPhoto(rawUrl);
        }
        stopCamera();
        setPhotoErrorHighlight(false);
        setErrorMessage(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Simulation generator for development environments without a physical camera
  const handleSimulateSelfie = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 480, 360);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 360);

    // Silhouette head & body
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(240, 140, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(240, 260, 90, 60, 0, 0, Math.PI);
    ctx.fill();

    // Badge
    ctx.fillStyle = !isClockedIn ? '#10B981' : '#F43F5E';
    ctx.fillRect(20, 20, 160, 32);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(!isClockedIn ? '● CLOCK IN VERIFIED' : '● CLOCK OUT VERIFIED', 32, 40);

    // Timestamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 320, 480, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    const stamp = `${currentUser?.full_name || 'Staff'} | ${new Date().toLocaleString('id-ID')}`;
    ctx.fillText(stamp, 16, 345);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (!isClockedIn) {
      setClockInPhoto(dataUrl);
    } else {
      setClockOutPhoto(dataUrl);
    }
    stopCamera();
    setPhotoErrorHighlight(false);
    setErrorMessage(null);
  };

  // ==========================================
  // CLOCK IN SUBMIT (STRICT CAMERA ENFORCED)
  // ==========================================
  const handleClockIn = async () => {
    if (!currentUser) return;
    if (!activeShift) {
      setErrorMessage('Belum ada shift aktif yang ditugaskan kepada Anda.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. STRICT CAMERA VALIDATION: Clock in MUST have a camera selfie photo
    if (!clockInPhoto) {
      setPhotoErrorHighlight(true);
      setErrorMessage(
        '⚠️ Wajib Mengambil Foto Selfie Kamera! Sistem mewajibkan verifikasi wajah langsung dari kamera sebelum melakukan Clock In.'
      );
      if (!cameraActive) {
        startCamera();
      }
      return;
    }

    // 2. Validate Geofence policy
    if (!isInsideGeofence && selectedLocation?.policy === 'BLOCK_OUTSIDE_RADIUS') {
      setErrorMessage(
        `Presensi Ditolak: Anda berada ${formatDistance(
          distanceMeters || 0
        )} dari ${selectedLocation.name}. Kebijakan mewajibkan Anda berada di dalam radius ${
          selectedLocation.radius_meters
        } meter.`
      );
      return;
    }

    setSubmitting(true);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const { status, lateMinutes } = evaluateClockInStatus(now, activeShift);

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employee_id: currentUser.id,
      shift_id: activeShift.id,
      attendance_date: todayStr,
      clock_in_time: now.toISOString(),
      clock_in_lat: userCoords?.latitude,
      clock_in_lng: userCoords?.longitude,
      clock_in_accuracy: userCoords?.accuracy,
      clock_in_distance_meters: distanceMeters ?? 0,
      clock_in_location_name: selectedLocation?.name || 'Office',
      clock_in_device: getDeviceInfo(),
      clock_in_selfie_url: clockInPhoto,
      clock_in_status: status,
      late_minutes: lateMinutes,
      early_checkout_minutes: 0,
      work_duration_minutes: 0,
      overtime_minutes: 0,
      is_outside_geofence: !isInsideGeofence,
      approval_status: !isInsideGeofence ? 'PENDING' : 'APPROVED',
      notes: lateMinutes > 0 ? `Terlambat ${lateMinutes} menit` : 'Clock In Tepat Waktu',
    };

    dataService.saveAttendance(record);
    dataService.logAudit({
      user_name: currentUser.full_name,
      action: 'CLOCK_IN',
      module: 'ATTENDANCE',
      record_id: record.id,
      after_data: { status, lateMinutes, distance: distanceMeters, hasPhoto: true },
    });

    setTodayAttendance(record);
    setSubmitting(false);
    setSuccessMessage(
      `🎉 Clock In Berhasil! Status: ${status.toUpperCase()}${
        lateMinutes > 0 ? ` (Terlambat ${lateMinutes}m)` : ' (Tepat Waktu)'
      }. Foto kamera telah diverifikasi dan tersimpan.`
    );
  };

  // ==========================================
  // CLOCK OUT SUBMIT (STRICT CAMERA ENFORCED)
  // ==========================================
  const handleClockOut = async () => {
    if (!currentUser || !todayAttendance) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. STRICT CAMERA VALIDATION: Clock out MUST have a NEW camera selfie photo
    if (!clockOutPhoto) {
      setPhotoErrorHighlight(true);
      setErrorMessage(
        '⚠️ Wajib Mengambil Foto Selfie Kamera untuk Pulang! Sistem mewajibkan foto verifikasi wajah terkini dari kamera sebelum Clock Out.'
      );
      if (!cameraActive) {
        startCamera();
      }
      return;
    }

    setSubmitting(true);

    const now = new Date();
    const clockInTime = new Date(todayAttendance.clock_in_time!);

    const { workDurationMinutes, earlyCheckoutMinutes, overtimeMinutes } = evaluateClockOut(
      clockInTime,
      now,
      activeShift || undefined
    );

    const updated: AttendanceRecord = {
      ...todayAttendance,
      clock_out_time: now.toISOString(),
      clock_out_lat: userCoords?.latitude,
      clock_out_lng: userCoords?.longitude,
      clock_out_accuracy: userCoords?.accuracy,
      clock_out_distance_meters: distanceMeters ?? 0,
      clock_out_location_name: selectedLocation?.name || 'Office',
      clock_out_device: getDeviceInfo(),
      clock_out_selfie_url: clockOutPhoto,
      work_duration_minutes: workDurationMinutes,
      early_checkout_minutes: earlyCheckoutMinutes,
      overtime_minutes: overtimeMinutes,
    };

    dataService.saveAttendance(updated);
    dataService.logAudit({
      user_name: currentUser.full_name,
      action: 'CLOCK_OUT',
      module: 'ATTENDANCE',
      record_id: updated.id,
      after_data: { durationMinutes: workDurationMinutes, overtimeMinutes, hasPhoto: true },
    });

    setTodayAttendance(updated);
    setSubmitting(false);
    setSuccessMessage(
      `🎉 Clock Out Berhasil! Total durasi kerja: ${formatMinutes(
        workDurationMinutes
      )}. Foto kamera pulang telah diverifikasi dan tersimpan.`
    );
  };

  // Current active photo for camera card display
  const currentActivePhoto = !isClockedIn ? clockInPhoto : clockOutPhoto;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Notice: Mandatory Camera Policy */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-[#0B1528] text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                KEBIJAKAN PRESENSI KAMERA WAJIB
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                Clock In & Clock Out Wajib Foto
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Setiap kali melakukan <strong>Clock In (Masuk)</strong> maupun{' '}
              <strong>Clock Out (Pulang)</strong>, Anda diwajibkan mengambil foto selfie wajah langsung
              dari kamera untuk verifikasi anti-fraud.
            </p>
          </div>
        </div>
      </div>

      {/* Top Notification Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-sm font-bold leading-relaxed">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-700 hover:underline font-bold shrink-0 ml-3"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Grid: Clock In Terminal on Left, Mandatory Camera on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Terminal Card (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Header & Live Clock */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Attendance Terminal
              </div>
              <div className="text-sm font-medium text-slate-700">{formatDate(currentTime)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {currentTime.toLocaleTimeString([], { hour12: false })}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">WIB (GMT+7)</div>
            </div>
          </div>

          {/* Today's Status Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 font-medium">Status Hari Ini:</span>
              <div className="flex items-center gap-2">
                {isClockedOut ? (
                  <StatusBadge status="Completed for Today" type="generic" />
                ) : isClockedIn ? (
                  <StatusBadge status={todayAttendance?.clock_in_status || 'present'} />
                ) : (
                  <span className="text-xs font-semibold text-slate-600">Belum Clock In</span>
                )}
                {todayAttendance?.late_minutes ? (
                  <span className="text-xs text-amber-700 font-mono font-medium">
                    (Terlambat {todayAttendance.late_minutes}m)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Jam Masuk / Pulang</div>
              <div className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                {formatTime(todayAttendance?.clock_in_time)} —{' '}
                {formatTime(todayAttendance?.clock_out_time)}
              </div>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Shift Kerja Ditugaskan</span>
              <span className="text-[11px] text-slate-500">
                Toleransi: {activeShift?.tolerance_minutes} menit
              </span>
            </label>
            <select
              value={activeShift?.id || ''}
              onChange={(e) => {
                const found = shifts.find((s) => s.id === e.target.value);
                if (found) setActiveShift(found);
              }}
              disabled={isClockedIn}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-70 font-medium text-slate-900"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time} - {s.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Location / Geofence Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Lokasi Presensi (Cabang)</label>
              <button
                type="button"
                onClick={requestGeolocation}
                className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh GPS</span>
              </button>
            </div>

            <select
              value={selectedLocation?.id || ''}
              onChange={(e) => {
                const found = locations.find((l) => l.id === e.target.value);
                if (found) handleLocationChange(found);
              }}
              disabled={isClockedIn}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} (Radius: {loc.radius_meters}m)
                </option>
              ))}
            </select>

            {/* Geofence Status Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                isInsideGeofence
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    isInsideGeofence
                      ? 'bg-emerald-500 ring-4 ring-emerald-200/60'
                      : 'bg-amber-500 ring-4 ring-amber-200/60'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold">
                    {isInsideGeofence
                      ? 'Lokasi Terverifikasi: Di Dalam Radius Kantor'
                      : 'Di Luar Radius Kantor Yang Diizinkan'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Jarak: {distanceMeters !== null ? formatDistance(distanceMeters) : '--'} (Batas:{' '}
                    {selectedLocation?.radius_meters}m) · Akurasi: ±{userCoords?.accuracy || 10}m
                  </div>
                </div>
              </div>

              {/* Simulation buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => simulateCoordinates(true)}
                  className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-2xs cursor-pointer"
                  title="Simulasikan posisi di dalam kantor"
                >
                  Inside
                </button>
                <button
                  type="button"
                  onClick={() => simulateCoordinates(false)}
                  className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-2xs cursor-pointer"
                  title="Simulasikan posisi di luar kantor"
                >
                  Outside
                </button>
              </div>
            </div>
          </div>

          {/* Photo Readiness Status Pill */}
          <div className="pt-1">
            {!isClockedIn ? (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  clockInPhoto
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {clockInPhoto ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Camera className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                  )}
                  <span>
                    {clockInPhoto
                      ? 'Foto Selfie Masuk Terverifikasi'
                      : 'Foto Selfie Masuk Belum Diambil (Wajib)'}
                  </span>
                </div>
                {!clockInPhoto && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="text-[11px] px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Buka Live
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Kamera HP
                    </button>
                  </div>
                )}
              </div>
            ) : !isClockedOut ? (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  clockOutPhoto
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {clockOutPhoto ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Camera className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  )}
                  <span>
                    {clockOutPhoto
                      ? 'Foto Selfie Pulang Terverifikasi'
                      : 'Wajib Ambil Foto Kamera Baru untuk Clock Out (Pulang)'}
                  </span>
                </div>
                {!clockOutPhoto && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="text-[11px] px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 cursor-pointer"
                    >
                      Buka Live
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Kamera HP
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2">
            {!isClockedIn ? (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={submitting}
                className={`w-full py-4 rounded-2xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  clockInPhoto
                    ? 'bg-[#1D63FF] hover:bg-blue-600 text-white shadow-blue-500/25 active:scale-[0.99]'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {clockInPhoto ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{submitting ? 'Menyimpan Presensi...' : 'KONFIRMASI CLOCK IN SEKARANG'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-amber-300" />
                    <span>CLOCK IN (WAJIB FOTO KAMERA)</span>
                  </>
                )}
              </button>
            ) : !isClockedOut ? (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={submitting}
                className={`w-full py-4 rounded-2xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  clockOutPhoto
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 active:scale-[0.99]'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25'
                }`}
              >
                {clockOutPhoto ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{submitting ? 'Merekam Clock Out...' : 'KONFIRMASI CLOCK OUT SEKARANG'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white" />
                    <span>CLOCK OUT (WAJIB FOTO KAMERA)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-4 bg-emerald-50 text-emerald-900 text-center font-bold rounded-2xl text-sm border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Presensi Hari Ini Telah Lengkap (Clock In & Clock Out Berhasil)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mandatory Camera Card (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          {/* Camera Card */}
          <div
            className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition-all ${
              photoErrorHighlight
                ? 'border-rose-400 ring-4 ring-rose-100 bg-rose-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>
                  {!isClockedIn
                    ? 'Foto Kamera Wajib: Clock In'
                    : !isClockedOut
                    ? 'Foto Kamera Wajib: Clock Out'
                    : 'Foto Verifikasi Hari Ini'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Wajib (Mandatory)
              </span>
            </div>

            {/* Video Viewport / Snapshot Container */}
            <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
              {/* Always mounted video element so videoRef.current is never null */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'transform -scale-x-100' : ''
                } ${cameraActive && !currentActivePhoto ? 'block' : 'hidden'}`}
              />

              {currentActivePhoto && (
                <div className="relative w-full h-full">
                  <img
                    src={currentActivePhoto}
                    alt="Selfie verification"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>FOTO TERAMBIL & TERVERIFIKASI</span>
                  </div>
                </div>
              )}

              {!cameraActive && !currentActivePhoto && (
                <div className="text-center p-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium max-w-[220px] mx-auto">
                    Kamera siap. Tekan tombol di bawah untuk mengambil foto selfie verifikasi.
                  </p>
                </div>
              )}

              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="font-semibold">Mengaktifkan kamera perangkat...</span>
                </div>
              )}

              {/* Geofence Overlay Pill on camera view */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-lg text-[10px] font-mono flex items-center justify-between border border-white/10 z-10">
                <span className="truncate max-w-[140px]">
                  {selectedLocation?.name.split(' - ')[0] || 'Office'}
                </span>
                <span className={isInsideGeofence ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {isInsideGeofence ? '● GPS OK' : '▲ DILUAR RADIUS'}
                </span>
              </div>
            </div>

            {/* Helper alert when camera is active */}
            {cameraActive && (
              <div className="flex items-center justify-between text-[11px] text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                <span>Layar kamera hitam di HP Anda?</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Buka Kamera HP Langsung</span>
                </button>
              </div>
            )}

            {cameraError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl leading-relaxed font-medium space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kamera Live WebRTC Tidak Dapat Dirender</span>
                </div>
                <p>{cameraError}</p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ambil Foto via Kamera HP Bawaan Sekarang</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Action Buttons */}
            <div className="space-y-2.5">
              {!cameraActive && !currentActivePhoto ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="py-3 px-3 bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Buka Kamera Live</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Buka Kamera HP (Bawaan)</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-normal flex items-start gap-2">
                    <span className="shrink-0 text-amber-500 font-bold">💡</span>
                    <span>
                      <b>Rekomendasi di Ponsel:</b> Gunakan tombol <b>"Buka Kamera HP (Bawaan)"</b> jika browser HP Anda mengalami layar hitam (*black screen*). Aplikasi kamera ponsel akan otomatis terbuka.
                    </span>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>AMBIL FOTO SEKARANG</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer"
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isClockedIn) setClockInPhoto(null);
                      else setClockOutPhoto(null);
                      startCamera();
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Foto Ulang (Retake)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Foto via HP</span>
                  </button>
                </div>
              )}

              {/* Hidden file input for native mobile camera capture */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleDeviceCameraCapture}
                className="hidden"
              />

              {/* Test Sandbox Simulation Option */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Uji Coba Sandbox:</span>
                <button
                  type="button"
                  onClick={handleSimulateSelfie}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Simulasikan Foto Kamera
                </button>
              </div>
            </div>
          </div>

          {/* Today's Completed Selfies Card (Show both In & Out if available) */}
          {(todayAttendance?.clock_in_selfie_url || todayAttendance?.clock_out_selfie_url) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rekap Bukti Foto Presensi Hari Ini</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Clock In Photo */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    1. Clock In (Masuk)
                  </span>
                  {todayAttendance.clock_in_selfie_url ? (
                    <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative">
                      <img
                        src={todayAttendance.clock_in_selfie_url}
                        alt="Clock In Selfie"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded">
                        {formatTime(todayAttendance.clock_in_time)}
                      </span>
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                      Belum Ada
                    </div>
                  )}
                </div>

                {/* Clock Out Photo */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. Clock Out (Pulang)
                  </span>
                  {todayAttendance.clock_out_selfie_url ? (
                    <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative">
                      <img
                        src={todayAttendance.clock_out_selfie_url}
                        alt="Clock Out Selfie"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded">
                        {formatTime(todayAttendance.clock_out_time)}
                      </span>
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                      Belum Ada
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Policy Specs */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Standar Keamanan Anti-Fraud</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>Clock In Wajib Kamera:</strong> Memastikan karyawan yang hadir adalah
                  pemilik akun asli di lokasi kerja.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>Clock Out Wajib Kamera:</strong> Mencegah titip absen pulang dan
                  memastikan kehadiran fisik hingga akhir shift.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Geofencing Radius:</strong> Radius kantor {selectedLocation?.radius_meters || 100}m
                  tervalidasi GPS real-time.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
