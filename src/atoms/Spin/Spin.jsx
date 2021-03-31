import React from 'react';
import Block from '../../components/Block';

const SIZE_MAP = {
  small: 3,
  medium: 4,
  large: 6,
};

export default function Spin({ size, spinning, style, children, ...props }) {
  size = SIZE_MAP[size] || size || 4;

  if (spinning === false) {
    return children;
  }

  return (
    <Block
      role="img"
      aria-label="Loading animation"
      height="1em"
      opacity=".8"
      style={{
        fontSize: size * 8,
        position: 'relative',
        ...(style || {}),
      }}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          margin: 'auto',
          display: 'inline-block',
          width: '1em',
          height: '1em',
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
      >
        <rect fill="#7a77ff" x="14" y="14" width="32" height="32" rx="4" ry="4">
          <animate
            attributeName="x"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="-2.083333333333333s"
          ></animate>
          <animate
            attributeName="y"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="-1.5151515151515151s"
          ></animate>
        </rect>
        <rect fill="#ff6492" x="14" y="14" width="32" height="32" rx="4" ry="4">
          <animate
            attributeName="x"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="-1.325757575757576s"
          ></animate>
          <animate
            attributeName="y"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="-0.7575757575757576s"
          ></animate>
        </rect>
        <rect fill="#727290" x="14" y="14" width="32" height="32" rx="4" ry="4">
          <animate
            attributeName="x"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="-0.5681818181818182s"
          ></animate>
          <animate
            attributeName="y"
            dur="2.272727272727273s"
            repeatCount="indefinite"
            keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1"
            values="14;54;54;54;54;14;14;14;14"
            begin="0s"
          ></animate>
        </rect>
      </svg>
    </Block>
  );
}
