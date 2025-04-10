'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import { Spin, message } from "antd"
import { nanoid } from 'nanoid'
import Flow from "../../components/Flow/Flow"


function NewCanvas() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [messageApi, contextHolder] = message.useMessage()
    const [canvasId, setCanvasId] = useState('')

    useEffect(() => {
        // Generate ID only on the client side
        setCanvasId(nanoid(10))
    }, [])

    useEffect(() => {
        const error = searchParams.get("error")
        if (error?.startsWith("canvas-not-found-")) {
            const canvasId = error.replace("canvas-not-found-", "")
            messageApi.error({
                content: `Cannot find canvas with ID ${canvasId}. Redirected to new canvas page.`,
                duration: 6,
            })
            router.replace("/canvas")
        }
    }, [])

    return (
        <ReactFlowProvider>
            {contextHolder}
            <Flow newCanvas canvasId={canvasId} />
        </ReactFlowProvider>
    )
}

export default function Index() {
    return (
        <Suspense fallback={<Spin spinning fullscreen />}>
            <NewCanvas />
        </Suspense>
    )
}
