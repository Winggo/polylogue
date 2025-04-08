'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import {
    ReactFlow,
    Background,
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

import LLMNode from "../LLMNode/LlmNode"
import CanvasInfo from "./CanvasInfo"
import {
    llmNodeSize,
    edgeStrokeColor,
    edgeStyles,
} from "../../utils/constants"


let id = 1
const getId = () => `${id++}`
const nodeTypes = {
    llmText: LLMNode,
}

type FlowProps = {
    canvasId?: string,
    initialNodes?: Node[],
    newCanvas?: boolean,
}
type ExtendedNode = Node & {
    id: string,
    position: object,
    type: string,
    data: object,
    model: string,
    prompt?: string,
    prompt_response?: string,
    parent_ids: Array<string>,
}


export default function Flow({ canvasId, initialNodes, newCanvas }: FlowProps) {
    const reactFlowInstance = useReactFlow()
    const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    useEffect(() => {
        if (initialNodes) {
            setNodes(initialNodes || [])
        }
    }, [initialNodes])

    useEffect(() => {
        if (newCanvas) return
        if (!reactFlowWrapper?.current) return
        const { width, height } = reactFlowWrapper.current.getBoundingClientRect()
        const position = {
            x: ((width / 2) - (llmNodeSize.width / 2)) * (1 / 0.9), // account for 0.9 zoom
            y: ((height / 2) - (llmNodeSize.height / 2)) * (1 / 0.9),
        };

        const newNode = {
            id: '0',
            position,
            type: 'llmText',
            data: {},
        }

        reactFlowInstance.addNodes(newNode)
    }, [reactFlowInstance, newCanvas])

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges],
    )

    const onConnectEnd = useCallback(
        (
            event: MouseEvent | TouchEvent,
            connectionState: { isValid: boolean | null; fromNode: Node | null }
        ) => {
            if (!connectionState.isValid) {
                const id = getId()
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event
                const newNode: Node = {
                    id,
                    position: reactFlowInstance.screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    type: 'llmText',
                    data: {},
                    origin: [0.0, 0.5],
                }

                setNodes((nds) => nds.concat(newNode))

                if (connectionState.fromNode !== null) {
                    const newEdge: Edge = {
                        id,
                        source: connectionState.fromNode.id,
                        target: id,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 20,
                            height: 20,
                            color: edgeStrokeColor,
                        },
                    }
                    setEdges((eds) => [...eds, newEdge])
                }
            }
        },
        [reactFlowInstance, setEdges, setNodes],
    )

    return (
        <div className="h-screen w-screen bg-gray-200" ref={reactFlowWrapper}>
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
                colorMode="light"
                defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
            >
                <Background gap={25} />
                <CanvasInfo canvasId={canvasId} />
            </ReactFlow>
        </div>
    )
}