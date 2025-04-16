export default function LLMNodeCard() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-around llm-node-card">
            <div className="cursor-text select-text text-center mt-[0px]">
                <span>Press ⇥ to use suggested prompt</span>
                <br />
                <span>Click on → icon to start an alternate dialogue</span>
                <br />
                <span>Click on ⋮⋮⋮ and drag to move node</span>
                <br />
                <span>Press ⌫ to delete selected node</span>
            </div>
            
            <div className="cursor-text select-text mb-[50px]">
                <span>You can...</span>
                <br />
                <span>- create a packing list 🏕️</span>
                <br />
                <span>- generate a 📚 report</span>
                <br />
                <span>- come up with 🎁 ideas</span>
                <br />
                <span>- write a love letter 🌹</span>
            </div>
        </div>
    )
}
