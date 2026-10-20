import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 465"
          width="32"
          height="32"
          fill="none"
        >
          <polygon
            points="66,51 363,51 304,125 219,127 219,234 139,233 138,125 8,125"
            fill="#0F172A"
          />
          <polygon
            points="446,6 545,6 183,457 29,280 133,280 182,335 341,136 365,134 365,107"
            fill="#0F172A"
          />
          <polygon
            points="509,112 553,181 394,382 593,383 534,457 235,456"
            fill="#FF5F01"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
