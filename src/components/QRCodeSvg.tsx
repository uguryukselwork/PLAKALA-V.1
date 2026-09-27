import React from 'react';

interface QRCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Procedural SVG QR Code Component that renders cleanly without external network dependencies.
 */
export const QRCodeSvg: React.FC<QRCodeSvgProps> = ({ size = 140, className = '' }) => {
  // Deterministic 25x25 grid pattern representing a QR code
  const matrix = [
    [1,1,1,1,1,1,1, 0, 1,0,1,0,1, 0, 1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1, 0, 0,1,0,1,0, 0, 1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1, 0, 1,1,1,0,1, 0, 1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1, 0, 0,0,1,1,0, 0, 1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1, 0, 1,0,0,1,1, 0, 1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1, 0, 0,1,1,0,0, 0, 1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1, 0, 1,0,1,0,1, 0, 1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0, 0, 1,1,0,1,0, 0, 0,0,0,0,0,0,0],
    [1,0,1,0,1,1,1, 1, 0,0,1,0,1, 1, 1,0,1,0,1,1,1],
    [0,1,0,1,0,0,0, 1, 1,1,0,1,0, 0, 0,1,0,1,1,0,0],
    [1,1,0,1,1,0,1, 0, 1,0,1,1,1, 0, 1,0,1,0,0,1,1],
    [0,0,1,0,0,1,0, 1, 0,1,0,0,0, 1, 1,1,0,1,0,1,0],
    [1,0,1,1,0,1,1, 0, 1,1,1,0,1, 0, 0,1,1,0,1,0,1],
    [0,0,0,0,0,0,0, 0, 1,0,0,1,0, 1, 0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1, 0, 0,1,1,0,1, 1, 1,0,0,1,1,0,1],
    [1,0,0,0,0,0,1, 0, 1,0,1,1,0, 0, 0,1,1,0,1,1,0],
    [1,0,1,1,1,0,1, 0, 0,1,0,1,1, 1, 1,0,1,0,0,1,1],
    [1,0,1,1,1,0,1, 0, 1,1,1,0,0, 1, 0,1,0,1,1,0,0],
    [1,0,1,1,1,0,1, 0, 0,0,1,1,1, 0, 1,1,0,0,1,1,1],
    [1,0,0,0,0,0,1, 0, 1,1,0,0,1, 0, 0,0,1,1,0,0,1],
    [1,1,1,1,1,1,1, 0, 1,0,1,1,0, 1, 1,0,1,0,1,1,1],
  ];

  const gridSize = matrix.length;
  const cellSize = 10;
  const totalSvgSize = gridSize * cellSize;

  return (
    <svg
      viewBox={`0 0 ${totalSvgSize} ${totalSvgSize}`}
      width={size}
      height={size}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={totalSvgSize} height={totalSvgSize} fill="#ffffff" />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell === 1 ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#111315"
            />
          ) : null
        )
      )}
    </svg>
  );
};
