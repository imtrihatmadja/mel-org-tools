import React, { useState } from 'react';
import { LocationData } from '../types';
import { Anchor, MapPin, Eye, Building2, Users } from 'lucide-react';

// @ts-ignore
import mapImage from '../assets/images/indonesia_silhouette_map_1781247185286.jpg';

interface IndonesiaMapProps {
  locations: LocationData[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string | null) => void;
}

export const IndonesiaMap: React.FC<IndonesiaMapProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // SVG Island detailed paths for an elegant, tech-forward, high-quality map visualization
  const islands = [
    {
      name: "Sumatera",
      path: "M 30 65 C 32 60 38 55 45 50 C 48 53 50 60 52 65 C 60 75 75 90 85 102 C 95 112 110 120 125 135 C 135 145 150 152 165 168 C 175 178 190 190 205 208 C 215 220 220 228 214 233 C 205 235 198 226 195 221 C 180 222 175 224 168 217 C 158 208 152 205 140 195 C 128 185 110 170 95 150 C 80 130 65 112 55 95 C 45 80 35 70 30 65 Z M 178 178 Q 185 180 190 195 Q 183 200 173 190 Z M 202 195 Q 210 196 212 204 Q 205 208 200 200 Z",
    },
    {
      name: "Jawa",
      path: "M 218 232 C 225 231 235 233 245 235 C 265 238 285 240 310 245 C 330 248 355 250 380 254 C 395 256 415 258 425 259 C 427 262 425 264 415 264 C 385 265 355 264 325 260 C 295 256 265 248 245 244 C 230 240 222 238 218 238 Z M 388 246 C 398 244 412 245 418 247 C 418 250 405 251 395 251 C 388 250 385 248 388 246 Z",
    },
    {
      name: "Kalimantan",
      path: "M 320 85 C 330 75 350 70 370 65 C 385 62 405 60 415 65 C 425 70 432 78 435 88 C 438 98 442 105 450 110 C 458 115 464 122 462 135 C 460 148 450 155 438 162 C 430 167 428 171 424 175 C 418 181 405 183 395 181 C 385 178 375 185 365 183 C 352 181 345 174 338 168 C 332 163 325 162 320 156 C 314 150 310 140 308 132 C 306 122 312 115 315 105 C 318 95 315 90 320 85 Z",
    },
    {
      name: "Sulawesi",
      path: "M 515 125 C 510 120 520 110 525 108 C 532 106 540 108 548 106 C 554 104 562 100 570 98 C 578 96 588 94 595 102 C 598 106 590 110 584 108 C 575 105 565 110 558 114 C 554 116 550 122 555 128 C 560 134 570 135 580 136 C 590 137 602 135 608 139 C 610 141 602 144 592 143 C 582 142 572 141 564 146 C 558 150 560 156 565 160 C 570 164 576 168 584 172 C 588 174 584 177 574 173 C 564 169 556 163 552 164 C 548 165 548 174 547 182 C 546 190 540 196 534 194 C 530 192 534 180 536 172 C 538 164 534 154 531 146 C 528 138 522 134 515 125 Z",
    },
    {
      name: "Nusa Tenggara & Bali",
      path: "M 432 262 Q 436 261 438 264 Q 434 266 431 264 Z M 444 264 Q 448 263 450 266 Q 446 268 443 266 Z M 456 265 C 462 263 470 263 475 266 C 478 268 472 271 465 272 C 458 273 454 268 456 265 Z M 488 268 C 498 266 508 266 518 267 C 523 268 525 271 520 273 C 510 275 498 274 492 272 C 488 271 486 269 488 268 Z M 494 280 C 502 278 510 281 512 284 C 508 288 498 288 492 285 C 490 282 492 281 494 280 Z M 536 278 C 546 272 558 268 568 273 C 574 276 572 281 562 285 C 552 289 542 289 536 284 C 534 282 534 280 536 278 Z",
    },
    {
      name: "Maluku",
      path: "M 622 96 C 625 90 635 85 642 90 C 640 100 632 108 630 114 C 632 118 638 120 644 122 C 642 126 634 124 628 120 C 622 116 618 106 622 96 Z M 624 148 C 634 146 644 148 654 151 C 655 154 645 156 635 155 C 625 154 622 150 624 148 Z M 605 148 C 612 146 618 148 620 152 C 615 155 608 155 605 151 Z",
    },
    {
      name: "Papua",
      path: "M 685 125 C 692 115 705 110 715 112 C 725 114 735 125 745 124 C 755 123 768 118 780 116 C 795 114 812 118 825 122 C 835 125 848 132 855 142 C 860 149 854 158 852 165 C 848 175 854 185 852 195 C 850 205 844 212 838 215 C 825 218 812 215 802 210 C 792 205 785 200 775 198 C 765 196 756 190 748 182 C 742 176 746 168 745 160 C 744 152 735 150 728 148 C 720 146 712 144 705 141 C 698 138 692 135 685 125 Z",
    }
  ];

  // Map physical pixel coordinates from our customized 900x360 SVG dimensions
  const getCoordinates = (loc: LocationData) => {
    if (loc.coordinates && loc.coordinates.x !== undefined) {
      // Scale percentage coordinates (0 to 100) to the viewBox 900x360
      const px = loc.coordinates.x > 100 ? loc.coordinates.x : (loc.coordinates.x / 100) * 900;
      const py = loc.coordinates.y > 100 ? loc.coordinates.y : (loc.coordinates.y / 100) * 360;
      return {
        x: px,
        y: py,
        labelOffset: (loc.coordinates as any).labelOffset || { x: -20, y: 15 }
      };
    }

    switch (loc.id) {
      case "muara-baru":
        return { x: 285, y: 247, labelOffset: { x: -75, y: 15 } };
      case "benoa":
        return { x: 445, y: 264, labelOffset: { x: -20, y: 22 } };
      case "bitung":
        return { x: 585, y: 104, labelOffset: { x: 18, y: -5 } };
      default:
        return { x: 450, y: 180, labelOffset: { x: 0, y: 0 } };
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-white border border-slate-200 rounded-xl p-4 md:p-6" id="map-section-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
            <Anchor className="w-5 h-5 text-blue-600" />
            Peta Pantau Jaringan Wilayah Kerja
          </h3>
          <p className="text-slate-500 text-xs font-sans mt-0.5">
            Klik pada pin lokasi untuk menampilkan rincian laporan pengorganisasian & penanganan kasus.
          </p>
        </div>
        
        {/* Map Legend */}
        <div className="flex items-center gap-4 text-xs font-sans bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-semibold text-slate-700 font-sans">Hub Aktif</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span>Rencana Ekspansi</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto bg-slate-50 rounded-lg border border-slate-200/60 p-2 scrollbar-thin scrollbar-thumb-slate-200" id="map-scroll-wrapper">
        {/* Helper swipe animation hint for lower breakpoints */}
        <div className="md:hidden text-[9px] font-mono text-slate-400 text-center mb-1 animate-pulse">
          &larr; Geser layar kekiri atau kekanan untuk melihat wilayah posko pelabuhan lain &rarr;
        </div>

        <div className="relative min-w-[850px] md:min-w-0 md:w-full h-[320px] md:h-auto md:aspect-[2.5/1] flex items-center justify-center">
          {/* SVG Map */}
          <svg
            viewBox="0 0 900 360"
            className="w-full h-full select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Grid Accent */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Oceans / Geographical texts */}
            <text x="310" y="310" className="fill-slate-300 font-sans tracking-widest uppercase font-semibold text-[10px]">Lautan Hindia</text>
            <text x="400" y="40" className="fill-slate-300 font-sans tracking-widest uppercase font-semibold text-[10px]">Laut Sulawesi / Pasifik</text>
            
            {/* Main Map Background Image (HD Detailed Silhouette) */}
            <image
              href={mapImage}
              x="0"
              y="0"
              width="900"
              height="360"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.92"
              className="pointer-events-none rounded-lg"
            />

            {/* Location Pins & Pulses */}
            {locations.map((loc) => {
              const { x, y, labelOffset } = getCoordinates(loc);
              const isSelected = selectedLocationId === loc.id;
              const isHovered = hoveredId === loc.id;

              return (
                <g
                  key={loc.id}
                  className="cursor-pointer"
                  onClick={() => onSelectLocation(isSelected ? null : loc.id)}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Large animated radar pulse */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 18 : 12}
                    className={`transition-all duration-500 fill-blue-500/10 stroke-blue-500/20`}
                    strokeWidth="1.5"
                  >
                    <animate
                      attributeName="r"
                      values={isSelected ? "12;24;12" : "8;16;8"}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Solid inner status circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 5}
                    className={`transition-all duration-300 ${
                      isSelected ? 'fill-blue-600 shadow-md' : 'fill-emerald-500'
                    }`}
                  />
                  
                  {/* Visual Label Frame */}
                  <rect
                    x={x + labelOffset.x - 4}
                    y={y + labelOffset.y - 12}
                    width={loc.name.length * 6.8 + 12}
                    height="18"
                    rx="4"
                    className={`transition-all duration-300 ${
                      isSelected
                        ? 'fill-blue-600 stroke-blue-700'
                        : isHovered
                        ? 'fill-slate-800'
                        : 'fill-white border border-slate-200 shadow-xs'
                    }`}
                  />

                  {/* Pin Text */}
                  <text
                    x={x + labelOffset.x + 2}
                    y={y + labelOffset.y + 1}
                    className={`font-sans font-semibold text-[9px] pointer-events-none transition-colors duration-300 ${
                      isSelected || isHovered ? 'fill-white' : 'fill-slate-700'
                    }`}
                  >
                    {loc.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Quick Info Card on Hover */}
          {locations.map((loc) => {
            const isHovered = hoveredId === loc.id;
            if (!isHovered) return null;

            const { x, y } = getCoordinates(loc);
            
            return (
              <div
                key={loc.id}
                className="absolute bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-xl pointer-events-none z-10 w-64 text-sm font-sans flex flex-col gap-2 transition-all"
                style={{
                  left: `${(x / 900) * 100}%`,
                  top: `${(y / 360) * 100 - 130}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-1.5">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{loc.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{loc.province}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {loc.stats.activeLearningCircles} K. Belajar
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Pekerja</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {loc.stats.workersReached.toLocaleString()} ABK
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Kasus</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {loc.stats.casesCount} Aduan
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1 bg-blue-50/50 p-1.5 rounded-lg mt-1 justify-center border border-blue-100">
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Klik untuk rincian lokasi
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default IndonesiaMap;
