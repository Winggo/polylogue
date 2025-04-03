'use client'

import React, { useCallback } from 'react'
import {
    ReactFlowProvider,
    ReactFlow,
    Background,
    Controls,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/base.css'

import LLMNode from "./LlmNode"
import ViewportInfo from './ViewportInfo'


const edgeStyles = {
    stroke: '#1F2937',
    strokeWidth: 2,
}

let id = 1
const getId = () => `${id++}`
const nodeTypes = {
    llmText: LLMNode,
}

const initialNodes = [
    {
        id: '0',
        position: { x: 10, y: 100 },
        type: 'llmText',
        data: {},
        selected: true,
    },
]


export default function Flow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const { screenToFlowPosition } = useReactFlow()

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [],
    )

    const onConnectEnd = useCallback(
        (event, connectionState) => {
            if (!connectionState.isValid) {
                const id = getId()
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event
                const newNode = {
                    id,
                    position: screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    type: 'llmText',
                    data: {},
                    origin: [0.0, 0.5],
                    selected: true,
                }
            
                setNodes((nds) => nds.concat(newNode))
                setEdges((eds) => {
                    return [...eds, { id, source: connectionState.fromNode.id, target: id }]
                })
            }
        },
        [screenToFlowPosition],
    )

    return (
        <ReactFlowProvider>
            <div className="h-screen w-screen bg-gray-200">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onConnectEnd={onConnectEnd}
                    preventScrolling={false}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={{ style: edgeStyles}}
                    connectionLineStyle={edgeStyles}
                >
                    <Background gap={25} />
                    <Controls position="top-right" showInteractive={false} />
                    <ViewportInfo />
                </ReactFlow>
            </div>
        </ReactFlowProvider>
    )
}