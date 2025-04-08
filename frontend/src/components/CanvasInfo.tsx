import { useState } from "react"
import { Controls, ControlButton, Panel, useStore } from "@xyflow/react"
import { Tooltip } from "antd"

const selector = (s: { transform: [number, number, number] }) => s.transform

type CanvasInfo = {
    canvasId?: string,
}

export default function CanvasInfo({ canvasId }: CanvasInfo) { 
    const [x, y, zoom] = useStore(selector)
    const [copyTooltipTitle, setCopyTooltipTile] = useState("Copy canvas ID")

    return (
        <>
            <Panel position="top-left" className="text-black">
                <p className="text-xl font-bold mt-[-4px]">Polylogue</p>
            </Panel>
            <Panel position="top-right" className="text-black text-right">
                <p className="font-medium text-lg">Canvas ID: {canvasId}</p>
            </Panel>
            <Controls
                position="top-right"
                showInteractive={true}
                style={{
                    "marginTop": "50px",
                }}
            >
                {canvasId && (
                    <Tooltip
                        title={copyTooltipTitle}
                        placement="left"
                        mouseLeaveDelay={0}
                    >
                        <ControlButton onMouseLeave={() => setCopyTooltipTile("Copy canvas ID")} onClick={() => {
                            navigator.clipboard.writeText(canvasId)
                            setCopyTooltipTile("Copied!")
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M17.5 14H19C20.1046 14 21 13.1046 21 12V5C21 3.89543 20.1046 3 19 3H12C10.8954 3 10 3.89543 10 5V6.5M5 10H12C13.1046 10 14 10.8954 14 12V19C14 20.1046 13.1046 21 12 21H5C3.89543 21 3 20.1046 3 19V12C3 10.8954 3.89543 10 5 10Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
                        </ControlButton>
                    </Tooltip>
                )}
            </Controls>
            <Panel position="bottom-right" className="text-black text-right text-md font-medium">
                x: {x.toFixed(2)}
                <br />
                y: {y.toFixed(2)}
                <br />
                zoom: {zoom.toFixed(2)}
            </Panel>
        </>
    )
}