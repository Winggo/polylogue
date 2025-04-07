import { useStore } from '@xyflow/react'

const selector = (s: { transform: [number, number, number] }) => s.transform

export default function ViewportInfo() {
    const [x, y, zoom] = useStore(selector)
  
    return (
      <div className="absolute bottom-0 right-0 m-5 text-black text-20 font-bold text-right">
          <p className="text-xl mb-1">Polylogue</p>
          <p>Current Viewport: x: {x.toFixed(2)}, y: {y.toFixed(2)}, zoom: {zoom.toFixed(2)}</p>
      </div>
    )
}