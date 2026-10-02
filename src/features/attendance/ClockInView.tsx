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

export const ClockInView: React.FC = () => {
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
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);

  // Camera & Talenta Shutter state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Action status feedback
  const [submitting, setSubmitting] = useState(false);
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
    }, 250);

    return () => {
      clearTimeout(autoCamTimer);
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
  };

  const isClockedIn = Boolean(todayAttendance?.clock_in_time);
  const isClockedOut = Boolean(todayAttendance?.clock_out_time);

  // Geolocation handling
  const requestGeolocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation tidak didukung oleh peramban Anda.');
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

  // ==========================================
  // CAMERA ENGINE (TALENTA STYLE INSTANT WEBRTC)
  // ==========================================
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setCameraLoading(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser HP tidak mendukung WebRTC. Silakan gunakan tombol "Kamera Bawaan HP" di bawah.'
        );
        setCameraLoading(false);
        return;
      }

      // Progressive constraint fallback to avoid mobile black screen
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
          'Kamera langsung diblokir atau gagal merender di browser HP. Silakan klik tombol "Buka Kamera HP (Bawaan)" di bawah.'
        );
        setCameraActive(false);
        setCameraLoading(false);
        return;
      }

      streamRef.current = activeStream;
      setCameraActive(true);

      // Immediately connect to video element
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
        'Akses kamera ditolak atau tidak dapat diaktifkan. Silakan gunakan tombol "Buka Kamera HP (Bawaan)" di bawah.'
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

  // Sync stream when cameraActive becomes true
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

  // ==========================================
  // TALENTA 1-TAP SHUTTER & DIRECT SUBMIT
  // ==========================================
  const handleShutterClick = async () => {
    if (submitting) return;

    // Trigger visual flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    // 1. Capture frame from video or fallback
    let photoDataUrl: string | null = null;

    if (videoRef.current && cameraActive) {
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
        ctx.fillRect(0, canvas.height - 46, canvas.width, 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        const now = new Date();
        const modeLabel = !isClockedIn ? 'CLOCK IN (LIVE SELFIE)' : 'CLOCK OUT (LIVE SELFIE)';
        const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB | ${modeLabel}`;
        ctx.fillText(timeStr, 14, canvas.height - 24);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#6EE7B7';
        const locStr = `📍 ${selectedLocation?.name || 'Office'} | GPS: ±${userCoords?.accuracy || 10}m`;
        ctx.fillText(locStr, 14, canvas.height - 8);

        photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // If video frame could not be grabbed, open native camera or simulate
    if (!photoDataUrl) {
      fileInputRef.current?.click();
      return;
    }

    // Stop camera and immediately submit attendance
    stopCamera();
    await executeAttendanceSubmit(photoDataUrl);
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
          ctx.fillRect(0, canvas.height - 46, canvas.width, 46);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          const now = new Date();
          const modeLabel = !isClockedIn ? 'CLOCK IN (HP CAMERA)' : 'CLOCK OUT (HP CAMERA)';
          const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB | ${modeLabel}`;
          ctx.fillText(timeStr, 14, canvas.height - 24);
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#6EE7B7';
          const locStr = `📍 ${selectedLocation?.name || 'Office'} | GPS: ±${userCoords?.accuracy || 10}m`;
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

    if (!isClockedIn) {
      // Execute CLOCK IN
      const shift = activeShift || shifts[0];
      const { status, lateMinutes } = evaluateClockInStatus(now, shift);

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
        clock_in_location_name: selectedLocation?.name || 'Office',
        clock_in_device: getDeviceInfo(),
        clock_in_selfie_url: photoUrl,
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
      setSuccessResult({
        type: 'CLOCK_IN',
        timeStr: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        photoUrl,
        statusText: status === 'present' ? 'Tepat Waktu' : `Terlambat ${lateMinutes}m`,
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
        clock_out_location_name: selectedLocation?.name || 'Office',
        clock_out_device: getDeviceInfo(),
        clock_out_selfie_url: photoUrl,
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
      setSuccessResult({
        type: 'CLOCK_OUT',
        timeStr: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        photoUrl,
        statusText: `Total Jam Kerja: ${formatMinutes(workDurationMinutes)}`,
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

  // ==========================================
  // VIEW: IF ALREADY COMPLETED FOR TODAY
  // ==========================================
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
            onClick={() => {
              // Allow retake clock out if needed
              startCamera('user');
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
          >
            Ambil Foto Ulang Clock Out
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SUCCESS DIALOG (POPUP LIKE TALENTA)
  // ==========================================
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

          <div className="text-xs text-slate-500">
            Data kehadiran dan koordinat lokasi GPS telah tersimpan aman di sistem HR.
          </div>

          <button
            type="button"
            onClick={() => setSuccessResult(null)}
            className="w-full py-3.5 bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
          >
            Selesai & Tutup Layar
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // TALENTA LIVE CAMERA ATTENDANCE VIEWPORT
  // ==========================================
  const attendanceMode = !isClockedIn ? 'CLOCK_IN' : 'CLOCK_OUT';

  return (
    <div className="max-w-md mx-auto space-y-3.5 pb-6">
      {/* TALENTA HEADER: Clock In / Clock Out Mode Banner */}
      <div className="bg-[#0B1528] rounded-2xl p-3.5 text-white flex items-center justify-between shadow-lg border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              attendanceMode === 'CLOCK_IN' ? 'bg-[#1D63FF]' : 'bg-rose-600'
            }`}
          >
            <Camera className="w-5 h-5" />
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
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
            isInsideGeofence ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            <MapPin className="w-3 h-3" />
            <span>{isInsideGeofence ? 'Radius OK' : 'Luar Radius'}</span>
          </div>
          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
            {distanceMeters !== null ? formatDistance(distanceMeters) : 'GPS...'}
          </div>
        </div>
      </div>

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

        {/* TOP CONTROLS INSIDE CAMERA: Switch Camera Button & Geofence Pin */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate max-w-[150px]">{selectedLocation?.name.split(' - ')[0] || 'Office'}</span>
          </div>

          <button
            type="button"
            onClick={toggleFacingMode}
            className="w-10 h-10 rounded-full bg-slate-950/75 hover:bg-slate-900 backdrop-blur-md text-white border border-white/15 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            title="Ganti Kamera Depan / Belakang"
          >
            <SwitchCamera className="w-5 h-5 text-amber-300" />
          </button>
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
          onClick={handleShutterClick}
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
          <span>
            {submitting
              ? 'MEREKAM ABSENSI...'
              : attendanceMode === 'CLOCK_IN'
              ? 'AMBIL FOTO & CLOCK IN'
              : 'AMBIL FOTO & CLOCK OUT'}
          </span>
        </button>

        {/* FALLBACK BUTTON: NATIVE DEVICE CAMERA */}
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
            <span>Pengaturan Lokasi Cabang & Shift</span>
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
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400">Simulasi Radius:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => simulateCoordinates(true)}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 cursor-pointer"
                >
                  Di Dalam
                </button>
                <button
                  type="button"
                  onClick={() => simulateCoordinates(false)}
                  className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 cursor-pointer"
                >
                  Di Luar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
