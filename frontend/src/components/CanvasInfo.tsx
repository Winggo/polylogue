import { Controls, Panel, useStore } from "@xyflow/react"

const selector = (s: { transform: [number, number, number] }) => s.transform

type CanvasInfo = {
    canvasId?: string,
}

export default function CanvasInfo({ canvasId }: CanvasInfo) { 
    const [x, y, zoom] = useStore(selector)

    return (
        <>
            <Controls
                position="top-right"
                showInteractive={true}
                style={{
                    "marginTop": "80px",
                }}
            />
            <Panel position="top-right" className="text-right">
                <p className="text-xl font-bold">Polylogue</p>
                <p className="font-medium">Canvas ID: {canvasId}</p>
            </Panel>
            <Panel position="bottom-right" className="text-right text-20 font-medium">
                Current Viewport: x: {x.toFixed(2)}, y: {y.toFixed(2)}, zoom: {zoom.toFixed(2)}
            </Panel>
        </>
    )
}