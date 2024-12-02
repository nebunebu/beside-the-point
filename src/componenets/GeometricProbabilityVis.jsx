import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';

const GeometricProbabilityViz = () => {
  const [bluePoint, setBluePoint] = useState({ x: 0.3, y: 0.4 });
  const [redPoint, setRedPoint] = useState({ x: 0.7, y: 0.6 });
  const [dragging, setDragging] = useState(null);
  const [intersects, setIntersects] = useState(false);
  const [showCircle, setShowCircle] = useState(true);
  const [showInscribed, setShowInscribed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Rosé Pine Theme Colors
  const theme = {
    light: {
      base: '#faf4ed',      // Base background
      surface: '#fffaf3',   // Surface background
      text: '#575279',      // Text
      subtle: '#6e6a86',    // Subtle text
      muted: '#9893a5',     // Muted elements
      iris: '#907aa9',      // Primary accent
      pine: '#286983',      // Secondary accent
      rose: '#d7827e',      // Tertiary accent
      love: '#b4637a',      // Highlight
      gold: '#ea9d34',      // Warning/special
      border: '#dfdad9',    // Borders
    },
    dark: {
      base: '#191724',      // Base background
      surface: '#1f1d2e',   // Surface background
      text: '#e0def4',      // Text
      subtle: '#908caa',    // Subtle text
      muted: '#6e6a86',     // Muted elements
      iris: '#c4a7e7',      // Primary accent
      pine: '#31748f',      // Secondary accent
      rose: '#ebbcba',      // Tertiary accent
      love: '#eb6f92',      // Highlight
      gold: '#f6c177',      // Warning/special
      border: '#26233a',    // Borders
    }
  };

  const currentTheme = darkMode ? theme.dark : theme.light;

  const size = 400;
  const padding = 40;
  const scale = (size - 2 * padding);

  const toSVG = (point) => ({
    x: point.x * scale + padding,
    y: (1 - point.y) * scale + padding
  });

  const toUnit = (point) => ({
    x: (point.x - padding) / scale,
    y: 1 - (point.y - padding) / scale
  });

  const formatNum = (num) => Number(num).toFixed(3);

  const parseCoordinate = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return clamp(num);
  };

  const handleCoordinateChange = (point, coord, value) => {
    const parsedValue = parseCoordinate(value);
    if (parsedValue === null) return;

    if (point === 'blue') {
      setBluePoint(prev => ({ ...prev, [coord]: parsedValue }));
    } else {
      setRedPoint(prev => ({ ...prev, [coord]: parsedValue }));
    }
  };

  const distance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const clamp = (value) => Math.max(0, Math.min(1, value));

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const unitCoords = toUnit({ x, y });
    const clampedCoords = {
      x: clamp(unitCoords.x),
      y: clamp(unitCoords.y)
    };

    if (dragging === 'blue') {
      setBluePoint(clampedCoords);
    } else if (dragging === 'red') {
      setRedPoint(clampedCoords);
    }
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const getClosestSide = () => {
    const { x, y } = bluePoint;
    const distances = {
      left: x,
      right: 1 - x,
      bottom: y,
      top: 1 - y
    };
    return Object.entries(distances).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  };

  const getPerpBisector = () => {
    const blue = toSVG(bluePoint);
    const red = toSVG(redPoint);

    const mx = (blue.x + red.x) / 2;
    const my = (blue.y + red.y) / 2;

    const dx = red.x - blue.x;
    const dy = red.y - blue.y;

    const px = -dy;
    const py = dx;

    const scale = 800;

    return {
      x1: mx - px,
      y1: my - py,
      x2: mx + px,
      y2: my + py
    };
  };

  const checkIntersection = () => {
    const closestSide = getClosestSide();
    const { x: bx, y: by } = bluePoint;
    const { x: rx, y: ry } = redPoint;

    const mx = (bx + rx) / 2;
    const my = (by + ry) / 2;

    const vx = rx - bx;
    const vy = ry - by;

    const px = -vy;
    const py = vx;

    if (closestSide === 'left') {
      const t = -mx / px;
      const y = my + t * py;
      return y >= 0 && y <= 1;
    } else if (closestSide === 'right') {
      const t = (1 - mx) / px;
      const y = my + t * py;
      return y >= 0 && y <= 1;
    } else if (closestSide === 'bottom') {
      const t = -my / py;
      const x = mx + t * px;
      return x >= 0 && x <= 1;
    } else {
      const t = (1 - my) / py;
      const x = mx + t * px;
      return x >= 0 && x <= 1;
    }
  };

  useEffect(() => {
    setIntersects(checkIntersection());
  }, [bluePoint, redPoint]);

  // Calculate derived values for rendering
  const blue = toSVG(bluePoint);
  const red = toSVG(redPoint);
  const perpBisector = getPerpBisector();
  const closestSide = getClosestSide();
  const radius = distance(bluePoint, redPoint) * scale;

  const CoordinateInput = ({ point, coords }) => (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full"
           style={{ backgroundColor: point === 'blue' ? currentTheme.iris : currentTheme.love }} />
      <div className="flex gap-2 items-center">
        <span style={{ color: currentTheme.text }}>x:</span>
        <input
          type="number"
          value={formatNum(coords.x)}
          onChange={(e) => handleCoordinateChange(point, 'x', e.target.value)}
          step="0.001"
          min="0"
          max="1"
          className="w-20 px-1 border rounded transition-colors duration-200"
          style={{
            backgroundColor: currentTheme.surface,
            color: currentTheme.text,
            borderColor: currentTheme.border
          }}
        />
        <span style={{ color: currentTheme.text }}>y:</span>
        <input
          type="number"
          value={formatNum(coords.y)}
          onChange={(e) => handleCoordinateChange(point, 'y', e.target.value)}
          step="0.001"
          min="0"
          max="1"
          className="w-20 px-1 border rounded transition-colors duration-200"
          style={{
            backgroundColor: currentTheme.surface,
            color: currentTheme.text,
            borderColor: currentTheme.border
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex gap-8 p-6 rounded-lg transition-colors duration-200"
         style={{ backgroundColor: currentTheme.base, color: currentTheme.text }}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: currentTheme.surface,
          color: darkMode ? currentTheme.gold : currentTheme.pine
        }}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="relative">
        <svg
          width={size}
          height={size}
          className="cursor-pointer rounded-lg transition-colors duration-200"
          style={{ backgroundColor: currentTheme.surface }}
          onMouseMove={handleMouseMove}
        >
          {/* Square border */}
          <rect
            x={padding}
            y={padding}
            width={scale}
            height={scale}
            fill="none"
            stroke={currentTheme.text}
            strokeWidth="2"
          />

          {/* Center point */}
          <circle
            cx={padding + scale/2}
            cy={padding + scale/2}
            r="3"
            fill={currentTheme.text}
          />

          {/* Inscribed circle */}
          {showInscribed && (
            <circle
              cx={padding + scale/2}
              cy={padding + scale/2}
              r={scale/2}
              fill="none"
              stroke={currentTheme.muted}
              strokeWidth="1"
            />
          )}

          {/* Lines from center to corners */}
          <line
            x1={padding + scale/2}
            y1={padding + scale/2}
            x2={padding}
            y2={padding + scale}
            stroke={currentTheme.subtle}
            strokeWidth="1.5"
          />
          <line
            x1={padding + scale/2}
            y1={padding + scale/2}
            x2={padding + scale}
            y2={padding + scale}
            stroke={currentTheme.subtle}
            strokeWidth="1.5"
          />

          {/* Purple circle */}
          {showCircle && (
            <circle
              cx={blue.x}
              cy={blue.y}
              r={radius}
              fill="none"
              stroke={currentTheme.iris}
              strokeWidth="1"
              strokeDasharray="4"
            />
          )}

          {/* Closest side highlight */}
          {closestSide === 'left' && (
            <line x1={padding} y1={padding} x2={padding} y2={size-padding} stroke={currentTheme.pine} strokeWidth="3" />
          )}
          {closestSide === 'right' && (
            <line x1={size-padding} y1={padding} x2={size-padding} y2={size-padding} stroke={currentTheme.pine} strokeWidth="3" />
          )}
          {closestSide === 'top' && (
            <line x1={padding} y1={padding} x2={size-padding} y2={padding} stroke={currentTheme.pine} strokeWidth="3" />
          )}
          {closestSide === 'bottom' && (
            <line x1={padding} y1={size-padding} x2={size-padding} y2={size-padding} stroke={currentTheme.pine} strokeWidth="3" />
          )}

          {/* Perpendicular bisector */}
          <line
            x1={padding}
            y1={perpBisector.y1 + (perpBisector.y2 - perpBisector.y1) * ((padding - perpBisector.x1) / (perpBisector.x2 - perpBisector.x1))}
            x2={size - padding}
            y2={perpBisector.y1 + (perpBisector.y2 - perpBisector.y1) * ((size - padding - perpBisector.x1) / (perpBisector.x2 - perpBisector.x1))}
            stroke={intersects ? currentTheme.pine : currentTheme.muted}
            strokeWidth="1"
            strokeDasharray="4"
          />

          {/* Points */}
          <circle
            cx={blue.x}
            cy={blue.y}
            r="8"
            fill={currentTheme.iris}
            cursor="pointer"
            onMouseDown={() => setDragging('blue')}
            className="hover:opacity-80"
          />
          <circle
            cx={red.x}
            cy={red.y}
            r="8"
            fill={currentTheme.love}
            cursor="pointer"
            onMouseDown={() => setDragging('red')}
            className="hover:opacity-80"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-6">
        {/* Coordinates Stack */}
        <div className="flex flex-col gap-4">
          <CoordinateInput point="blue" coords={bluePoint} />
          <CoordinateInput point="red" coords={redPoint} />
          <div style={{ color: currentTheme.subtle }} className="text-sm flex items-center">
            Distance: {formatNum(distance(bluePoint, redPoint))}
          </div>
        </div>

        {/* Buttons Stack */}
        <div className="flex flex-col gap-3">
          <button
            className="px-4 py-2 rounded transition-colors duration-200 text-left"
            style={{
              backgroundColor: currentTheme.rose,
              color: darkMode ? currentTheme.base : currentTheme.surface
            }}
            onClick={() => setShowCircle(!showCircle)}
          >
            {showCircle ? 'Hide' : 'Show'} Circle
          </button>
          <button
            className="px-4 py-2 rounded transition-colors duration-200 text-left"
            style={{
              backgroundColor: currentTheme.pine,
              color: darkMode ? currentTheme.base : currentTheme.surface
            }}
            onClick={() => setShowInscribed(!showInscribed)}
          >
            {showInscribed ? 'Hide' : 'Show'} Inscribed Circle
          </button>
        </div>

        {/* Status Messages */}
        <div className="flex flex-col gap-2">
          <div className="text-sm" style={{ color: intersects ? currentTheme.pine : currentTheme.love }}>
            {intersects ?
              "The perpendicular bisector intersects the closest side! ✓" :
              "The perpendicular bisector does not intersect the closest side ✗"
            }
          </div>
          <div className="text-xs" style={{ color: currentTheme.subtle }}>
            The circle shows all possible positions of the red point that would create the same perpendicular bisector angle
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeometricProbabilityViz;
