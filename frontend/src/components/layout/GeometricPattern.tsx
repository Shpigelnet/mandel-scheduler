// Repeating triangle pattern from the Mandel screenshots
export default function GeometricPattern({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height: 32 }}>
      <svg
        width="100%"
        height="32"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="tri" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            {/* Top-left triangle – teal */}
            <polygon points="0,0 32,0 0,32" fill="#1D5E4E" />
            {/* Bottom-right triangle – cream */}
            <polygon points="32,0 32,32 0,32" fill="#F5F0E8" />
            {/* Inner top-right – lighter teal */}
            <polygon points="16,0 32,0 32,16" fill="#2A7A65" />
            {/* Inner bottom-left – darker cream */}
            <polygon points="0,16 16,32 0,32" fill="#EDE7D8" />
          </pattern>
        </defs>
        <rect width="100%" height="32" fill="url(#tri)" />
      </svg>
    </div>
  );
}
