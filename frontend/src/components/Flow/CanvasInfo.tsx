import { useState, useEffect } from "react"
import { Controls, ControlButton, Panel, useStore } from "@xyflow/react"
import { Button, Tooltip, Input } from "antd"
import '@ant-design/v5-patch-for-react-19'

import CopyIcon from "../../icons/CopyIcon"


const selector = (s: { transform: [number, number, number] }) => s.transform
const polylogue = ['P', 'o', 'l', 'y', 'l', 'o', 'g', 'u', 'e', ' ', '💬']

type CanvasInfo = {
    canvasId?: string,
    canvasTitle?: string,
    handleSaveCanvas: Function,
    savingCanvas: boolean,
}

export default function CanvasInfo({ canvasId, canvasTitle, handleSaveCanvas, savingCanvas }: CanvasInfo) { 
    const [x, y, zoom] = useStore(selector)
    const [curBrand, setCurBrand] = useState("")
    const [curCanvasTitle, setCurCanvasTitle] = useState("[Your Canvas]")
    const [copyTooltipTitle, setCopyTooltipTile] = useState("Copy canvas ID")

    useEffect(() => {
        if (curBrand !== 'Polylogue 💬') {
            const timer = setTimeout(() => {
                setCurBrand(curBrand + polylogue[curBrand.length])
            }, 20)
            return () => {
                clearTimeout(timer)
            }
        }
    }, [curBrand])

    useEffect(() => {
        if (canvasTitle) {
            setCurCanvasTitle(canvasTitle)
        }
    }, [canvasTitle])

    const renderTopRightPanel = () => {
        if (!canvasId) return
        return (
            <><Panel position="top-right" className="text-black text-right">
                <Tooltip
                    title={<div>
                        <b>Save & Retrieve link</b>
                        <br />
                        <span>Revisit with link or share with others</span>
                    </div>}
                    placement="left"
                    mouseLeaveDelay={0}
                >
                    <Button
                        className=" mt-[5px] mb-[5px] !pl-[20px] !pr-[20px] !pt-[20px] !pb-[20px] !shadow-xl"
                        loading={savingCanvas}
                        onClick={() => handleSaveCanvas({ curCanvasTitle })}
                    >
                        <div className="font-semibold">Save Canvas</div>
                    </Button>
                </Tooltip>
                </Panel>
                <Controls
                    position="top-right"
                    showInteractive={true}
                    className="shadow-xl"
                    style={{
                        "marginTop": "75px",
                    }}
                >
                    <Tooltip
                        title={copyTooltipTitle}
                        placement="left"
                        mouseLeaveDelay={0}
                    >
                        <ControlButton
                            onMouseLeave={() => setCopyTooltipTile("Copy canvas ID")}
                            onClick={() => {
                                if (!canvasId) return
                                navigator.clipboard.writeText(canvasId)
                                setCopyTooltipTile("Copied!")
                            }}
                        >
                            <CopyIcon />
                        </ControlButton>
                    </Tooltip>
            </Controls></>
        )
    }

    return (
        <>
            <Panel position="top-left" className="text-black">
                <p className="text-2xl font-bold mt-[-6px] cursor-default">{curBrand}</p>
            </Panel>
            {renderTopRightPanel()}
            <Panel position="top-center" className="top-center-panel">
                <Input
                    value={curCanvasTitle}
                    onChange={(e) => setCurCanvasTitle(e.target.value)}
                    variant="borderless"
                    size="large"
                    className="!text-lg text-center canvas-title-input"
                    maxLength={60}
                />
            </Panel>
            <Panel position="bottom-left" className="!z-3 text-black text-left text-md font">
                x: {(-x).toFixed(2)}
                <br />
                y: {y.toFixed(2)}
                <br />
                zoom: {zoom.toFixed(2)}
            </Panel>
            <Panel position="bottom-center" className="!z-3 text-black text-center !ml-0">
                Press ⌘+' to create new nodes
                <br />
                Drag on background to move across canvas
                <br />
                Scroll with mouse or pinch on trackpad to zoom in & out
            </Panel>
            <Panel position="bottom-right" className="!z-3 text-black text-sm">
                © {new Date().getFullYear()} Winggo Tse
            </Panel>
        </>
    )
}