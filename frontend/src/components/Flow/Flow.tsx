'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import {
    ReactFlow,
    Background,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    MarkerType,
    type Connection,
    type Node,
    type Edge,
} from '@xyflow/react'
import { Fade } from "react-awesome-reveal"
import { nanoid } from 'nanoid'
import { message } from "antd"

import LLMNode from "../LLMNode/LlmNode"
import CanvasInfo from "./CanvasInfo"
import {
    llmNodeSize,
    edgeStrokeColor,
    edgeStyles,
    localBackendServerURL as backendServerURL,
} from "../../utils/constants"


let id = 1
const getId = () => `${id++}`
const nodeTypes = {
    llmText: LLMNode,
}

type createNewLlmTextNodeParams = {
    position: { x: number, y: number },
    selected?: boolean,
    origin?: [number, number] | null,
    data?: object,
}

function createNewLlmTextNode(
    {position, selected=true, origin, data={}}
    : createNewLlmTextNodeParams): ExtendedNode {
    const newNode = {
        id: nanoid(10),
        position,
        type: 'llmText',
        data: data as ExtendedNodeData,
        selected,
        origin: origin ?? [0, 0],
        measured: llmNodeSize,
    }
    return newNode
}

export type ExtendedNodeData = {
    model?: string,
    prompt?: string,
    prompt_response?: string,
    parent_ids?: Array<string>,
    setNode: Function,
}

export type ExtendedNode = Node & {
    id: string,
    type: string,
    position: {
        x: number,
        y: number,
    },
    data: ExtendedNodeData,
    selected: boolean,
    measured: {
        width: number,
        height: number,
    },
    origin: number[],
}

type FlowProps = {
    canvasId: string,
    canvasTitle?: string,
    existingNodes?: ExtendedNode[],
    newCanvas?: boolean,
}


function createEdge(sourceId: string, targetId: string) {
    return {
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: edgeStrokeColor,
        },
    }
}


export default function Flow({ canvasId, canvasTitle, existingNodes, newCanvas }: FlowProps) {
    const reactFlowInstance = useReactFlow()
    const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
    const [messageApi, contextHolder] = message.useMessage()
    const [flowRendered, setFlowRendered] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [savingCanvas, setSavingCanvas] = useState(false)
    const [nodes, setNodes, onNodesChange] = useNodesState<ExtendedNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    // Existing nodes present, create edges for them
    useEffect(() => {
        if (existingNodes) {
            const edgesForExistingNodes: Edge[] = []
            for (const exNode of existingNodes) {
                if (exNode.data.parent_ids && exNode.data.parent_ids.length > 0) {
                    for (const parentId of exNode.data.parent_ids) {
                        edgesForExistingNodes.push(
                            createEdge(parentId, exNode.id)
                        )
                    }   
                }
            }
            setNodes((nds) => nds.concat(existingNodes || []))
            setEdges((eds) => eds.concat(edgesForExistingNodes))
        }
    }, [existingNodes])

    // Upon new canvas, create single node in center of canvas
    useEffect(() => {
        if (!newCanvas) return
        if (!reactFlowWrapper?.current) return
        const { width, height } = reactFlowWrapper.current.getBoundingClientRect()
        const position = {
            x: ((width / 2) - (llmNodeSize.width / 2)) * (1 / 0.86), // account for 0.9 zoom
            y: (height / 2) * (1 / 0.9),
        };

        const newNode = createNewLlmTextNode({
            position,
            data: { setNode },
            origin: [0.0, 0.5],
        })

        reactFlowInstance.addNodes(newNode)
    }, [])

    // Create new node on Cmd/Ctrl + '
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY })
        }
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === '\'') {
                event.preventDefault()

                const nodePosition = reactFlowInstance.screenToFlowPosition({
                    x: cursorPosition.x,
                    y: cursorPosition.y,
                })
                const newNode = createNewLlmTextNode({
                    position: nodePosition,
                    data: { setNode },
                })
                setNodes((nds) => {
                    return nds.map((n) => {
                        return { ...n, selected: false }
                    }).concat({ ...newNode, selected: true }) 
                })
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [setNodes, cursorPosition])

    const setNode = (nodeId: string, newData: ExtendedNodeData) => {
        return setNodes((nds) => 
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...newData,
                        }
                    }
                }
                return node
            })
        )
    }

    const handleSaveCanvas = async ({ curCanvasTitle }: { curCanvasTitle: string }) => {
        setSavingCanvas(true)
        try {
            const saveNodes = nodes.map((node) => ({
                id: node.id,
                type: node.type,
                position: node.position,
                data: node.data,
                selected: node.selected,
                measured: node.measured,
                origin: node.origin,
            }))
            const response = await fetch(`${backendServerURL}/ds/v1/canvases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    canvasId,
                    title: curCanvasTitle,
                    nodes: saveNodes,
                }),
            })
            if (response.status === 200) {
                messageApi.open({
                    type: 'success',
                    content: 'Saved successfully!',
                    duration: 6,
                })
            } else {
                messageApi.error({
                    content: 'Cannot save canvas. Please try again in a moment.',
                    duration: 6,
                })
            }
        } catch(err) {
            messageApi.error({
                content: 'Cannot save canvas. Please try again in a moment.',
                duration: 6,
            })
        } finally {
            setSavingCanvas(false)
        }
    }

    const onConnect = useCallback(
        (connection: Connection) => setEdges(
            (eds) => {
                const newEdge: Edge = createEdge(connection.source, connection.target)
                return addEdge(newEdge, eds)
            }
        ),
        [setEdges],
    )

    const onConnectEnd = useCallback(
        (
            event: MouseEvent | TouchEvent,
            connectionState: { isValid: boolean | null; fromNode: Node | null }
        ) => {
            if (!connectionState.isValid && connectionState.fromNode !== null) {
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event
                const nodePosition = reactFlowInstance.screenToFlowPosition({
                    x: clientX,
                    y: clientY,
                })

                // Prevent new node from being created on top of existing one
                // Let's move the new node 200px to right
                const rightDeltaX = nodePosition.x - connectionState.fromNode.position.x
                const deltaY = Math.abs(nodePosition.y - connectionState.fromNode.position.y)
                if (((rightDeltaX - llmNodeSize.width) < 50) && deltaY < 100) {
                    nodePosition.x += 200
                }

                const newNode = createNewLlmTextNode({
                    position: nodePosition,
                    origin: [0.0, 0.5],
                    data: { setNode },
                })
                setNodes((nds) => nds.concat(newNode))

                const newEdge: Edge = createEdge(connectionState.fromNode.id, newNode.id)
                setEdges((eds) => [...eds, newEdge])

                reactFlowInstance.setCenter(
                    nodePosition.x + llmNodeSize.width/2,
                    nodePosition.y,
                    { duration: 1000, zoom: 1.0 }
                )
            }
        },
        [reactFlowInstance, setEdges, setNodes],
    )

    return (
        <Fade delay={0} duration={1000} cascade damping={0.5} triggerOnce>
            <div className="h-screen w-screen bg-gray-200" ref={reactFlowWrapper}>
                {contextHolder}
                <ReactFlow
                    onInit={() => setFlowRendered(true)}
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
                    {flowRendered && (
                        <CanvasInfo
                            canvasId={canvasId}
                            canvasTitle={canvasTitle}
                            handleSaveCanvas={handleSaveCanvas}
                            savingCanvas={savingCanvas}
                        />
                    )}
                </ReactFlow>
            </div>
        </Fade>
    )
}