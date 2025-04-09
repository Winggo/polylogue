'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import Flow, { type ExtendedNode } from "../../../components/Flow/Flow"
import { localBackendServerURL as backendServerURL } from '@/utils/constants'


interface Canvas {
    canvas_id: string;
    title: string;
    description?: string;
    nodes: ExtendedNode[];
}


export default function Index() {
    const { canvas_id }: { canvas_id: string } = useParams()
    const router = useRouter()

    const [canvas, setCanvas] = useState<Canvas | null>(null)

    const fetchCanvas = async () => {
        try {
            const response = await fetch(`${backendServerURL}/ds/v1/canvases/${canvas_id}`)
            const canvas = await response.json()
            setCanvas(canvas["document"])
        } catch(err) {
            setCanvas(null)
            router.push(`/canvas?error=canvas-not-found-${canvas_id}`)
        }
    }

    useEffect(() => {
        fetchCanvas()
    }, [canvas_id, router])

    return (
        <ReactFlowProvider>
            <Flow canvasId={canvas_id} canvasTitle={canvas?.title} existingNodes={canvas?.["nodes"] || []} />
        </ReactFlowProvider>
    )
}
