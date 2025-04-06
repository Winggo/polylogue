import React from 'react'
import {
    ReactFlowProvider,
} from '@xyflow/react'
import { WebsSocketProvider } from '../helpers/websocketClient'
import Flow from "../components/Flow"


export default function Index() {
    return (
        <WebsSocketProvider>
            <ReactFlowProvider>
                <Flow />
            </ReactFlowProvider>
        </WebsSocketProvider>
    )
}

