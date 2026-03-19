export const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uZoom;
uniform float uGridSpacing;
uniform float uDotRadius;
uniform vec4 uDotColor;
uniform vec4 uBgColor;

void main() {
    // Pixel coordinates in the canvas space
    vec2 pixelCoord = v_uv * uResolution;
    
    // Convert to world coordinates applying pan (offset) and zoom
    vec2 worldCoord = (pixelCoord - uOffset) / uZoom;
    
    // Grid cell modulo
    vec2 cell = mod(worldCoord, uGridSpacing);
    
    // Distance from the center of the cell
    vec2 center = vec2(uGridSpacing * 0.5);
    float dist = length(cell - center);
    
    // Anti-aliased dot drawing
    // We scale the distance by zoom so the dots themselves retain their
    // pixel size perfectly at all zoom levels on screen.
    float screenDist = dist * uZoom;
    float alpha = 1.0 - smoothstep(uDotRadius - 0.5, uDotRadius + 0.5, screenDist);
    
    // Add sub-grid (major dots every 5 grid cells for better orientation scale)
    vec2 majorCell = mod(worldCoord, uGridSpacing * 5.0);
    float majorDist = length(majorCell - vec2(uGridSpacing * 2.5));
    float majorScreenDist = majorDist * uZoom;
    float majorAlpha = 1.0 - smoothstep(uDotRadius * 1.5 - 0.5, uDotRadius * 1.5 + 0.5, majorScreenDist);

    float finalAlpha = max(alpha, majorAlpha) * uDotColor.a;
    
    // Mix background color with dot color based on alpha
    if (uBgColor.a > 0.0) {
        vec3 color = mix(uBgColor.rgb, uDotColor.rgb, finalAlpha);
        outColor = vec4(color, uBgColor.a);
    } else {
        // Transparent background support
        outColor = vec4(uDotColor.rgb, finalAlpha);
    }
}
`;
