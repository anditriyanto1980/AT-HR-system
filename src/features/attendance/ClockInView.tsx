import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Compass,
  ArrowRight,
  ShieldAlert,
  User,
  Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  AttendanceLocation,
  AttendanceRecord,
  Branch,
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
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    // Start GPS request
    requestGeolocation();

    return () => {
      stopCamera();
    };
  }, [currentUser]);

  const loadData = () => {
    if (!currentUser) return;
    const locs = dataService.getLocations();
    setLocations(locs);

    // Pick branch location matching employee branch, or fallback to first
    const matchedLoc =
      locs.find((l) => l.branch_id === currentUser.branch_id) || locs[0] || null;
    setSelectedLocation(matchedLoc);

    const sList = dataService.getShifts();
    setShifts(sList);
    // Default to Normal shift
    const defaultShift = sList.find((s) => s.is_active) || sList[0] || null;
    setActiveShift(defaultShift);

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = dataService.getTodayAttendance(currentUser.id, todayStr);
    setTodayAttendance(existing || null);
  };

  // Geolocation handling
  const requestGeolocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
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
          'Could not retrieve GPS coordinates. You can click "Simulate Location" below to test geofencing.'
        );
        setGpsLoading(false);
        // Fallback default coordinates close to Jakarta office for seamless previewing
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

  // Recalculate distance when location selection changes
  const handleLocationChange = (loc: AttendanceLocation) => {
    setSelectedLocation(loc);
    if (userCoords) {
      evaluateDistance(userCoords, loc);
    }
  };

  // Simulate GPS coordinates (Inside vs Outside) for testing
  const simulateCoordinates = (isInside: boolean) => {
    if (!selectedLocation) return;
    let newCoords: Coordinates;
    if (isInside) {
      // 25 meters from office
      newCoords = {
        latitude: selectedLocation.latitude + 0.00015,
        longitude: selectedLocation.longitude + 0.00015,
        accuracy: 10,
      };
    } else {
      // 1.5 km away from office
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

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraError('Camera access unavailable or blocked. You can still proceed without photo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSelfiePhoto(dataUrl);
      stopCamera();
    }
  };

  // CLOCK IN SUBMIT
  const handleClockIn = async () => {
    if (!currentUser) return;
    if (!activeShift) {
      setErrorMessage('No active shift assigned.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate Geofence policy
    if (!isInsideGeofence && selectedLocation?.policy === 'BLOCK_OUTSIDE_RADIUS') {
      setErrorMessage(
        `Attendance rejected: You are ${formatDistance(
          distanceMeters || 0
        )} away from ${selectedLocation.name}. Policy strictly enforces presence inside the ${
          selectedLocation.radius_meters
        }m radius.`
      );
      setSubmitting(false);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Evaluate tolerance & late status
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
      clock_in_selfie_url: selfiePhoto || undefined,
      clock_in_status: status,
      late_minutes: lateMinutes,
      early_checkout_minutes: 0,
      work_duration_minutes: 0,
      overtime_minutes: 0,
      is_outside_geofence: !isInsideGeofence,
      approval_status: !isInsideGeofence ? 'PENDING' : 'APPROVED',
      notes: lateMinutes > 0 ? `Late by ${lateMinutes} minutes` : 'On-time Clock In',
    };

    dataService.saveAttendance(record);
    dataService.logAudit({
      user_name: currentUser.full_name,
      action: 'CLOCK_IN',
      module: 'ATTENDANCE',
      record_id: record.id,
      after_data: { status, lateMinutes, distance: distanceMeters },
    });

    setTodayAttendance(record);
    setSubmitting(false);
    setSuccessMessage(
      `Clock In Successful! Status: ${status.toUpperCase()}${
        lateMinutes > 0 ? ` (${lateMinutes}m late)` : ' (On Time)'
      }`
    );
  };

  // CLOCK OUT SUBMIT
  const handleClockOut = async () => {
    if (!currentUser || !todayAttendance) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
      clock_out_selfie_url: selfiePhoto || todayAttendance.clock_out_selfie_url,
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
      after_data: { durationMinutes: workDurationMinutes, overtimeMinutes },
    });

    setTodayAttendance(updated);
    setSubmitting(false);
    setSuccessMessage(
      `Clock Out Successful! Total working duration: ${formatMinutes(workDurationMinutes)}.`
    );
  };

  const isClockedIn = Boolean(todayAttendance?.clock_in_time);
  const isClockedOut = Boolean(todayAttendance?.clock_out_time);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Notification Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Clock In Terminal on Left, Live Context on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Terminal Card */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Header & Live Clock */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Attendance Terminal
              </div>
              <div className="text-sm font-medium text-slate-600">{formatDate(currentTime)}</div>
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
              <span className="text-xs text-slate-500 font-medium">Today's State:</span>
              <div className="flex items-center gap-2">
                {isClockedOut ? (
                  <StatusBadge status="Completed for Today" type="generic" />
                ) : isClockedIn ? (
                  <StatusBadge status={todayAttendance?.clock_in_status || 'present'} />
                ) : (
                  <span className="text-xs font-semibold text-slate-600">Not Clocked In Yet</span>
                )}
                {todayAttendance?.late_minutes ? (
                  <span className="text-xs text-amber-700 font-mono font-medium">
                    ({todayAttendance.late_minutes}m late)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">In / Out Time</div>
              <div className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                {formatTime(todayAttendance?.clock_in_time)} —{' '}
                {formatTime(todayAttendance?.clock_out_time)}
              </div>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Assigned Shift</span>
              <span className="text-[11px] text-slate-500">
                Tolerance: {activeShift?.tolerance_minutes} mins
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
              <label className="text-xs font-semibold text-slate-700">Attendance Location</label>
              <button
                type="button"
                onClick={requestGeolocation}
                className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
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
                    isInsideGeofence ? 'bg-emerald-500 ring-4 ring-emerald-200/60' : 'bg-amber-500 ring-4 ring-amber-200/60'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold">
                    {isInsideGeofence
                      ? 'Location Verified: Inside Office Radius'
                      : 'Outside Allowed Attendance Area'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Distance: {distanceMeters !== null ? formatDistance(distanceMeters) : '--'}{' '}
                    (Allowed: {selectedLocation?.radius_meters}m) · Accuracy: ±
                    {userCoords?.accuracy || 10}m
                  </div>
                </div>
              </div>

              {/* Quick simulation toggle for testing */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => simulateCoordinates(true)}
                  className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-2xs"
                  title="Simulate user standing inside office"
                >
                  Inside
                </button>
                <button
                  type="button"
                  onClick={() => simulateCoordinates(false)}
                  className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-2xs"
                  title="Simulate user standing outside office radius"
                >
                  Outside
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            {!isClockedIn ? (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={submitting}
                className="w-full py-4 bg-[#1D63FF] hover:bg-blue-600 active:scale-[0.99] text-white rounded-2xl text-base font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="w-5 h-5 text-amber-300" />
                <span>{submitting ? 'Verifying & Clocking In...' : 'CLOCK IN NOW'}</span>
              </button>
            ) : !isClockedOut ? (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={submitting}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Clock className="w-5 h-5 text-white" />
                <span>{submitting ? 'Recording Clock Out...' : 'CLOCK OUT NOW'}</span>
              </button>
            ) : (
              <div className="w-full py-3.5 bg-slate-100 text-slate-600 text-center font-semibold rounded-xl text-sm border border-slate-200">
                Attendance Completed for Today
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selfie Camera & Verification Sidebar */}
        <div className="md:col-span-5 space-y-6">
          {/* Camera Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <Camera className="w-4 h-4 text-slate-700" />
                <span>Selfie Photo Verification</span>
              </div>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>

            {/* Video Viewport / Snapshot Container */}
            <div className="relative aspect-4/3 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {selfiePhoto ? (
                <img
                  src={selfiePhoto}
                  alt="Selfie verification"
                  className="w-full h-full object-cover"
                />
              ) : cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-[200px]">
                    Live camera capture for face verification
                  </p>
                </div>
              )}

              {/* Geofence Overlay Pill on camera view */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-xs text-white p-2 rounded-lg text-[10px] font-mono flex items-center justify-between">
                <span>{selectedLocation?.name.split(' - ')[0] || 'Office'}</span>
                <span>{isInsideGeofence ? '● GPS VERIFIED' : '▲ OUTSIDE'}</span>
              </div>
            </div>

            {cameraError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{cameraError}</p>
            )}

            {/* Camera Controls */}
            <div className="flex items-center gap-2">
              {!cameraActive && !selfiePhoto ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Camera</span>
                </button>
              ) : cameraActive ? (
                <>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-2 bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Capture Snapshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelfiePhoto(null);
                    startCamera();
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Policy Specs Info */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Attendance Policy Specs</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400">·</span>
                <span>
                  <strong>Tolerance:</strong> Clock in up to {activeShift?.tolerance_minutes || 10}{' '}
                  mins past {activeShift?.start_time || '08:00'} is treated as ON TIME.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">·</span>
                <span>
                  <strong>Geofence:</strong> Must be within {selectedLocation?.radius_meters || 100}
                  m radius of {selectedLocation?.name}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">·</span>
                <span>
                  <strong>Audit:</strong> GPS coordinates, accuracy, and browser user-agent are logged.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
