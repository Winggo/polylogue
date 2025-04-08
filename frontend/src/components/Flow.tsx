'use client'

import React, { useCallback } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    MarkerType,
    Connection,
    Node,
    Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/base.css'

import LLMNode from "./LlmNode"
import CanvasInfo from "./CanvasInfo"


const strokeColor = '#1F2937'
const edgeStyles = {
    stroke: strokeColor,
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
        position: { x: 100, y: 100 },
        type: 'llmText',
        data: {},
        selected: true,
    },
]

type FlowProps = {
    canvasId?: string,
}


export default function Flow({ canvasId }: FlowProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const { screenToFlowPosition } = useReactFlow()

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        [],
    )

    const onConnectEnd = useCallback(
        (
            event: MouseEvent | TouchEvent,
            connectionState: { isValid: boolean | null; fromNode: Node }
        ) => {
            if (!connectionState.isValid || !connectionState.fromNode) {
                const id = getId()
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event
                const newNode: Node = {
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
                const newEdge: Edge = {
                    id,
                    source: connectionState.fromNode.id,
                    target: id,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: strokeColor,
                    },
                }
            
                setNodes((nds) => nds.concat(newNode))
                setEdges((eds) => [...eds, newEdge])
            }
        },
        [screenToFlowPosition],
    )

    return (
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
                <CanvasInfo canvasId={canvasId} />
            </ReactFlow>
        </div>
    )
}