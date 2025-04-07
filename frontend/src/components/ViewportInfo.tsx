import { useStore } from '@xyflow/react'


type ViewportInfoProps = {
    canvasId: string,
}

const selector = (s: { transform: [number, number, number] }) => s.transform

export default function ViewportInfo({ canvasId }: ViewportInfoProps) {
    const [x, y, zoom] = useStore(selector)
  
    return (
        <div className="absolute bottom-0 m-5 text-black text-20 font-bold">
            {canvasId}
            Current Viewport: x: {x.toFixed(2)}, y: {y.toFixed(2)}, zoom: {zoom.toFixed(2)}{' '}
        </div>
    )
}