import type { ReactElement, SVGProps } from 'react'
import houseStrokeSvg from '../../assets/house_stroke.svg?raw'
import garageDoorSvg from '../../assets/garage-door.svg?raw'
import garageDoor2Svg from '../../assets/garage-door-2.svg?raw'

type GarageIconProps = {
  size?: number
  'aria-hidden'?: boolean
}

function baseProps(size: number, ariaHidden?: boolean): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': ariaHidden
  }
}

export function IconGarageRaised({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M5 20V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V20" />
      <path d="M7.5 9.8h9M7.5 12.6h9M7.5 15.4h9" />
      <path d="M9 18h6" />
      <path d="M10.2 20h.01M13.8 20h.01" />
    </svg>
  )
}

export function IconGarageSlats({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <rect x="5.5" y="4.5" width="13" height="15.5" rx="2" />
      <path d="M5.5 8.8h13M5.5 12.6h13M5.5 16.4h13" />
      <path d="M10.7 18.2h2.6" />
    </svg>
  )
}

export function IconGarageWindows({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <rect x="5.5" y="4.5" width="13" height="15.5" rx="2" />
      <path d="M8 7h1.8M11.1 7h1.8M14.2 7h1.8" />
      <path d="M5.5 9.6h13M5.5 13.2h13M5.5 16.8h13" />
      <path d="M10.7 18.5h2.6" />
    </svg>
  )
}

export function IconGableSpark({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M3.5 10.8 12 4.8l8.5 6" />
      <path d="M6.5 9.2V20h11V9.2" />
      <path d="M12 12.6l.75 2.15 2.15.75-2.15.75-.75 2.15-.75-2.15-2.15-.75 2.15-.75z" />
    </svg>
  )
}

export function IconGableDoor({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M3.5 10.8 12 4.8l8.5 6" />
      <path d="M6.5 9.2V20h11V9.2" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

export function IconPegboard({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h.01M16 9h.01M8 13.5h.01M16 13.5h.01M8 17.6h.01M16 17.6h.01" />
      <path d="M9.8 8.8h4.4M12 8.8V17" />
    </svg>
  )
}

export function IconHoist({ size = 24, 'aria-hidden': ariaHidden }: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M4.5 20V8h15v12" />
      <path d="M4.5 11h15" />
      <path d="M12 11v3.2" />
      <path d="M12 14.2v1.6a1.7 1.7 0 0 1-3.4 0" />
    </svg>
  )
}

export function IconHouseStroke({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <span
      className="inline-flex [&_svg]:size-full"
      style={{ width: size, height: size }}
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: houseStrokeSvg }}
    />
  )
}

export function IconGarageDoor({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <span
      className="inline-flex [&_svg]:size-full"
      style={{ width: size, height: size }}
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: garageDoorSvg }}
    />
  )
}

export function IconGarageDoor2({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <span
      className="inline-flex [&_svg]:size-full"
      style={{ width: size, height: size }}
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: garageDoor2Svg }}
    />
  )
}

export function IconGarageSketch({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M1.5 21.8h21" />
      <rect x="1.2" y="0.8" width="21.6" height="3.4" rx="0.9" />
      <path d="M2.8 4.2v17.6M21.2 4.2v17.6" />
      <rect x="4" y="5.6" width="16" height="2.5" rx="0.7" />
      <path d="M5.2 8.1v13.7M18.8 8.1v13.7" />
      <rect x="6" y="9.7" width="12" height="3.9" rx="0.6" />
      <rect x="6.7" y="10.3" width="2" height="1.25" rx="0.3" />
      <rect x="9.55" y="10.3" width="2" height="1.25" rx="0.3" />
      <rect x="12.4" y="10.3" width="2" height="1.25" rx="0.3" />
      <rect x="15.25" y="10.3" width="2" height="1.25" rx="0.3" />
      <rect x="6.7" y="12" width="2" height="1.25" rx="0.3" />
      <rect x="9.55" y="12" width="2" height="1.25" rx="0.3" />
      <rect x="12.4" y="12" width="2" height="1.25" rx="0.3" />
      <rect x="15.25" y="12" width="2" height="1.25" rx="0.3" />
      <rect x="6" y="14.8" width="12" height="6" rx="0.5" />
      <path d="M6 16.8h12M6 18.8h12" />
    </svg>
  )
}

export function IconGarageGlass({
  size = 24,
  'aria-hidden': ariaHidden
}: GarageIconProps): ReactElement {
  return (
    <svg {...baseProps(size, ariaHidden)}>
      <path d="M1.8 21.8h20.4" />
      <rect x="2" y="1" width="20" height="3" rx="0.8" />
      <path d="M3.6 4v17.8M20.4 4v17.8" />
      <rect x="5.2" y="5.4" width="13.6" height="2.6" rx="0.7" />
      <path d="M6.6 8v13.8M17.4 8v13.8" />
      <rect x="7.6" y="9.4" width="8.8" height="11.2" rx="0.5" />
      <path d="M10.5 9.4v11.2M13.5 9.4v11.2" />
      <path d="M7.6 13.1h8.8M7.6 16.8h8.8" />
    </svg>
  )
}
