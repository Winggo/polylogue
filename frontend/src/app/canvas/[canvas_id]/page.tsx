import React from 'react'
import { useParams } from 'next/navigation'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import Flow from "../../../components/Flow"


export default function Index() {
    const { canvas_id }: { canvas_id: string } = useParams()

    return (
        <ReactFlowProvider>
            <Flow canvasId={canvas_id} />
        </ReactFlowProvider>
    )
}
