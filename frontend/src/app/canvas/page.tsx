'use client'

import React from 'react'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import Flow from "../../components/Flow"


export default function Index() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    )
}
