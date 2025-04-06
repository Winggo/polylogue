'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'


const WebSocketContext = createContext<Socket | null>(null)
const backendServerURL = 'http://127.0.0.1:5000'


export const WebsSocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    
    useEffect(() => {
        const socket = io(backendServerURL, {
            transports: ['websocket'],
        })
        setSocket(socket)

        socket.on("connect", () => {
            console.log("WebSocket connected")
        })

        socket.on("disconnect", () => {
            console.log("Disconnected from socket")
        })

        return () => {
            socket.off("disconnect")
            socket.disconnect()
        }
    }, [])
  
    return (
        <WebSocketContext.Provider value={socket}>
            {children}
        </WebSocketContext.Provider>
    )
}
  
export const useWebSocket = () => {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider')
    }
    return context
}
