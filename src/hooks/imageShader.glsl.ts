export const imageVertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

uniform mat3 u_matrix;

out vec2 v_texCoord;

void main() {
  // Multiply the position by the matrix.
  vec3 position = u_matrix * vec3(a_position, 1.0);
  
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const imageFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform sampler2D u_mask;
uniform float u_alpha;
uniform float u_isSelected;
uniform float u_showMask;

out vec4 outColor;

void main() {
    vec4 texColor = texture(u_image, v_texCoord);
    vec4 maskColor = texture(u_mask, v_texCoord);
    
    // Discard transparent pixels
    if (texColor.a < 0.05) {
        discard;
    }

    // Base color
    vec4 finalColor = vec4(texColor.rgb, texColor.a * u_alpha);

    // Apply mask overlay (red highlight)
    if (u_showMask > 0.5 && maskColor.a > 0.1) {
        finalColor.rgb = mix(finalColor.rgb, vec3(1.0, 0.2, 0.2), 0.5);
    }

    // Draw an outline if selected
    if (u_isSelected > 0.5) {
        float border = 0.01;
        if (v_texCoord.x < border || v_texCoord.x > 1.0 - border || 
            v_texCoord.y < border || v_texCoord.y > 1.0 - border) {
            outColor = vec4(0.2, 0.5, 1.0, 1.0); // Blue highlight
            return;
        }
    }
    
    outColor = finalColor;
}
`;

// Helper math functions for 3x3 2D Matrices
export const m3 = {
  projection: function(width: number, height: number) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },

  translation: function(tx: number, ty: number) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  scaling: function(sx: number, sy: number) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },

  multiply: function(a: number[], b: number[]) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};
