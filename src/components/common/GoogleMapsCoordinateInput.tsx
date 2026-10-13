import React, { useState } from 'react';
import {
  MapPin,
  Clipboard,
  ExternalLink,
  Navigation,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { parseCoordinates, parseSingleCoordinate, getGoogleMapsUrl, isValidLatLng } from '../../utils/coordinateParser';

interface GoogleMapsCoordinateInputProps {
  latitude: number | string;
  longitude: number | string;
  onChange: (lat: number, lng: number) => void;
  radiusMeters?: number;
  onChangeRadius?: (radius: number) => void;
  label?: string;
  helperText?: string;
  showRadius?: boolean;
}

export const GoogleMapsCoordinateInput: React.FC<GoogleMapsCoordinateInputProps> = ({
  latitude,
  longitude,
  onChange,
  radiusMeters,
  onChangeRadius,
  label = 'Titik Koordinat Lokasi Absen (Google Maps)',
  helperText = 'Bisa langsung copy-paste titik koordinat (-6.2087, 106.8455) atau link Google Maps',
  showRadius = false,
}) => {
  const [quickPasteText, setQuickPasteText] = useState('');
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [parseErrorMsg, setParseErrorMsg] = useState<string | null>(null);
  const [gettingCurrentGps, setGettingCurrentGps] = useState(false);

  const numLat = typeof latitude === 'number' ? latitude : parseFloat(latitude) || 0;
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(longitude) || 0;

  // Process any text that might contain coordinates (raw lat/lng, url, etc)
  const processPastedText = (rawText: string): boolean => {
    setParseErrorMsg(null);
    setParseSuccessMsg(null);

    const parsed = parseCoordinates(rawText);
    if (parsed) {
      onChange(parsed.latitude, parsed.longitude);
      setParseSuccessMsg(
        `Berhasil! Titik terbaca: Lat ${parsed.latitude.toFixed(6)}, Lng ${parsed.longitude.toFixed(6)} (${
          parsed.formatDetected === 'GOOGLE_MAPS_URL'
            ? 'Link Google Maps'
            : parsed.formatDetected === 'DMS'
            ? 'Format Derajat DMS'
            : 'Koordinat Google Maps'
        })`
      );
      setQuickPasteText(parsed.formattedString);
      return true;
    } else {
      setParseErrorMsg(
        'Format tidak dikenali. Pastikan berformat "-6.2087634, 106.845599" atau URL resmi Google Maps.'
      );
      return false;
    }
  };

  // Clipboard paste button
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setQuickPasteText(text);
          processPastedText(text);
        } else {
          setParseErrorMsg('Clipboard kosong. Silakan salin titik dari Google Maps terlebih dahulu.');
        }
      } else {
        setParseErrorMsg('Izin clipboard tidak tersedia. Gunakan Ctrl+V / Paste manual ke kotak di bawah.');
      }
    } catch (err) {
      setParseErrorMsg('Akses clipboard dicegah browser. Silakan paste manual (Ctrl+V) ke kotak.');
    }
  };

  // Get current GPS position from user's device
  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      setParseErrorMsg('Browser tidak mendukung Geolocation GPS.');
      return;
    }
    setGettingCurrentGps(true);
    setParseErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChange(lat, lng);
        setQuickPasteText(`${lat}, ${lng}`);
        setParseSuccessMsg(`Berhasil mengambil titik GPS saat ini: Lat ${lat}, Lng ${lng} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
        setGettingCurrentGps(false);
      },
      (err) => {
        setParseErrorMsg(`Gagal memperoleh GPS: ${err.message}. Pastikan izin lokasi aktif.`);
        setGettingCurrentGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Smart paste handlers on individual Latitude / Longitude text inputs
  const handleLatitudePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    // Check if user pasted a coordinate pair into the latitude field
    const parsed = parseCoordinates(pastedData);
    if (parsed) {
      e.preventDefault();
      onChange(parsed.latitude, parsed.longitude);
      setParseSuccessMsg(`Terdeteksi pasangan koordinat! Latitude & Longitude terisi otomatis.`);
      setParseErrorMsg(null);
    } else {
      // Single coordinate parsing
      const single = parseSingleCoordinate(pastedData);
      if (single !== null) {
        e.preventDefault();
        onChange(single, numLng);
      }
    }
  };

  const handleLongitudePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    // Check if user pasted a coordinate pair into the longitude field
    const parsed = parseCoordinates(pastedData);
    if (parsed) {
      e.preventDefault();
      onChange(parsed.latitude, parsed.longitude);
      setParseSuccessMsg(`Terdeteksi pasangan koordinat! Latitude & Longitude terisi otomatis.`);
      setParseErrorMsg(null);
    } else {
      // Single coordinate parsing
      const single = parseSingleCoordinate(pastedData);
      if (single !== null) {
        e.preventDefault();
        onChange(numLat, single);
      }
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200">
      {/* Header and Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <label className="text-xs font-bold text-slate-800">{label}</label>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            title="Tempel langsung dari Clipboard perangkat"
          >
            <Clipboard className="w-3 h-3 text-emerald-600" />
            <span>Tempel dari Clipboard</span>
          </button>
          <button
            type="button"
            onClick={handleGetCurrentGps}
            disabled={gettingCurrentGps}
            className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            title="Gunakan posisi GPS perangkat saat ini sebagai titik absen"
          >
            <Navigation className={`w-3 h-3 text-blue-600 ${gettingCurrentGps ? 'animate-spin' : ''}`} />
            <span>{gettingCurrentGps ? 'Mencari...' : 'GPS Saat Ini'}</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {helperText}
      </p>

      {/* QUICK PASTE BAR (Takes Full Google Maps Copy or Links) */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={quickPasteText}
            onChange={(e) => {
              setQuickPasteText(e.target.value);
              if (e.target.value.trim().length > 3) {
                processPastedText(e.target.value);
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              setTimeout(() => {
                if (pasted) processPastedText(pasted);
              }, 10);
            }}
            placeholder="Paste di sini: -6.2087634, 106.845599 atau link Google Maps..."
            className="w-full pl-3 pr-20 py-2 text-xs bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans transition-all"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {quickPasteText && (
              <button
                type="button"
                onClick={() => {
                  setQuickPasteText('');
                  setParseSuccessMsg(null);
                  setParseErrorMsg(null);
                }}
                className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => processPastedText(quickPasteText)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>

        {/* Success feedback badge */}
        {parseSuccessMsg && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">{parseSuccessMsg}</span>
          </div>
        )}

        {/* Error feedback badge */}
        {parseErrorMsg && (
          <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-medium">{parseErrorMsg}</span>
          </div>
        )}
      </div>

      {/* INDIVIDUAL LATITUDE & LONGITUDE INPUTS (Supports direct paste & comma conversions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Garis Lintang (Latitude) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={latitude}
              onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                const num = parseFloat(val);
                onChange(isNaN(num) ? 0 : num, numLng);
              }}
              onPaste={handleLatitudePaste}
              placeholder="-6.21462"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono text-slate-900"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Bisa paste format titik koordinat langsung ke sini
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Garis Bujur (Longitude) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={longitude}
              onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                const num = parseFloat(val);
                onChange(numLat, isNaN(num) ? 0 : num);
              }}
              onPaste={handleLongitudePaste}
              placeholder="106.82155"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono text-slate-900"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Format desimal standar Google Maps
          </span>
        </div>
      </div>

      {/* RADIUS (OPTIONAL) & GOOGLE MAPS PREVIEW BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
        {showRadius && onChangeRadius && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-700 shrink-0">
              Radius Geofence:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="2000"
                value={radiusMeters ?? 100}
                onChange={(e) => onChangeRadius(parseInt(e.target.value) || 100)}
                className="w-20 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono text-center"
              />
              <span className="text-xs text-slate-500 font-semibold">meter</span>
            </div>
          </div>
        )}

        {/* Google Maps External Verification Button */}
        <div className="flex items-center gap-2">
          {isValidLatLng(numLat, numLng) && (
            <a
              href={getGoogleMapsUrl(numLat, numLng)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Uji Titik di Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
