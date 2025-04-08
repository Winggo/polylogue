'use client'

import React, { useEffect, useState } from 'react'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import { nanoid } from 'nanoid'
import Flow from "../../components/Flow/Flow"


export default function Index() {
    const [canvasId, setCanvasId] = useState('')

    useEffect(() => {
        // Generate ID only on the client side
        setCanvasId(nanoid(8))
    }, [])

    return (
        <ReactFlowProvider>
            <Flow canvasId={canvasId} />
        </ReactFlowProvider>
    )
}
