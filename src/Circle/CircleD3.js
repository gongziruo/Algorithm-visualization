import "./circle.css"
import {useEffect} from "react";
import * as d3 from "d3";
import {tree} from "./Node";
import {getRandomInt, sampleFromGumbel, sleep} from "./utils";

const Circle = ()=>{

    let svg;
    const radius = 14;
    const width = 1000;
    const height = 500;
    const margin = 80;

    const stepHeight = 120;

    // const getMarginByLevel = (level)=>{
    //     if (level === 0){
    //         return 0;
    //     }else if (level === 1){
    //         return 320;
    //     }else if (level === 2){
    //         return 140;
    //     }else if (level === 3){
    //         return 60;
    //     }else if (level == 4){
    //         return 10;
    //     }
    // }

    const getMarginByLevel = (level)=>{
        if (level === 0){
            return 0;
        }else if (level === 1){
            return 280;
        }else if (level === 2){
            return 70;
        }else if (level === 3){
            return 5;
        }else if (level === 4){
            return 5;
        }
    }
    const drawCircle = (x, y, prob)=>{
        svg.append('circle').attr('cx', x).attr('cy', y).attr('r', radius).attr('stroke', 'gray').attr('fill', "gray");
        svg.append("text").attr("x", x-8).attr("y", y+3).attr("stroke", "black").style("font", "10px times").text((prob).toFixed(2));
    }

    const drawCircleWithBg = (x, y, prob, bg)=>{
        svg.append('circle').attr('cx', x).attr('cy', y).attr('r', radius).attr('stroke', 'gray').attr('fill', bg);
        svg.append("text").attr("x", x-8).attr("y", y+3).attr("stroke", "black").style("font", "10px times").text((prob).toFixed(2));
    }

    const drawLine = (x1, y1, x2, y2)=>{
        svg.append('line').attr("x1", x1).attr("y1", y1+radius).attr("x2", x2).attr("y2", y2-radius).attr("stroke", "gray").attr("strokeWidth", 2)
    }

    const drawNodes = (data, lastX, lastY)=>{


    }
    const draw = ()=>{


        svg = d3.select("#canvas").append("svg").attr("width", width).attr("height", height).style("border", "1px solid black");

        let x = width/2;
        let y = stepHeight;
        // root
        drawCircle(x, y, 1.0)
        tree.root.xPosition = x
        tree.root.yPosition = y
    }

    const getPosition = (node, index)=>{
        console.log("node", node)
        const count = tree.vocabulary.length
        console.log("count", count)
        const totalLength = count * (radius * 2) + (count - 1) * getMarginByLevel(node.value.level)
        console.log("totalLength", totalLength)

        const x = node.parent.xPosition - totalLength/2 + radius + index * 2 * radius + index *  getMarginByLevel(node.value.level)
        const y = stepHeight * (node.value.level + 1)
        console.log(node.key, totalLength, x)

        node.xPosition = x
        node.yPosition = y

        return [x, y]

    }

    // const getPosition = (node)=>{
    //     console.log("node", node)
    //     const count = Math.pow(tree.vocabulary.length, node.value.level)
    //     console.log("count", count)
    //     const totalLength = count * (radius * 2) + (count - 1) * margin * (tree.sequenceLength - node.value.level)
    //     console.log("totalLength", totalLength)
    //
    //     const previousNodesCount = 1 * (1 - Math.pow(tree.vocabulary.length, node.value.level))/(1 - tree.vocabulary.length)
    //     console.log("previousNodesCount", previousNodesCount)
    //     const index = node.key -  previousNodesCount
    //     console.log("index", index)
    //     const x = width/2 - totalLength/2 + radius + index * 2 * radius + index * margin * (tree.sequenceLength - node.value.level)
    //     const y = stepHeight * (node.value.level + 1)
    //     console.log(node.key, totalLength, x)
    //
    //     return [x, y]
    //
    // }
    const drawElement = (child, index)=>{
        // draw circle
        // const [parentX, parentY] = getPosition(child.parent)
        const [x, y] = getPosition(child, index)
        drawCircle(x, y, child.value.prob)
        drawLine(child.parent.xPosition, y-stepHeight, x, y)
    }

    const traverseTreeWidthFirst=(node, visited)=>{

        for (let i = 0; i < node.children.length; i++){
            const child = node.children[i]

            if(visited.indexOf(child.key) === -1){
                drawElement(child, i)
                visited.push(child.key)
                console.log("visited", visited)
            }

        }
        for (let i = 0; i < node.children.length; i++){
            const child = node.children[i]
            traverseTreeWidthFirst(child, visited)
        }
    }

    const getNodesByLevel=(node, visited, level)=>{
        let nodes = []

        for (let i = 0; i < node.children.length; i++){
            const child = node.children[i]

            if(visited.indexOf(child.key) === -1) {
                if (child.value.level === level) {
                    nodes.push(child)
                }
                visited.push(child.key)
            }

        }
        for (let i = 0; i < node.children.length; i++){
            const child = node.children[i]
            const out = getNodesByLevel(child, visited, level)
            nodes = [...nodes, ...out]
        }
        return nodes
    }

    useEffect(()=>{
        draw()
        traverseTreeWidthFirst(tree.root, [])
    }, [])

    const confirmNode = (node)=>{
        drawCircleWithBg(node.xPosition, node.yPosition, node.value.prob, "green")
    }

    const candidateNode = (node)=>{
        drawCircleWithBg(node.xPosition, node.yPosition, node.value.prob, "yellow")
    }


    const  doSample1 = async ()=>{
        // choose root
        confirmNode(tree.root)
        await sleep(2)

        let parentNodes = [tree.root]
        for (let i = 1; i < tree.sequenceLength+1; i++){
            // get all nodes, the level of them equals to i + 1
            const nodes = getNodesByLevel(tree.root, [], i)

            // filter nodes
            const nodesFiltered = nodes.filter(item => {
                for (let i = 0; i < parentNodes.length; i++){
                    if(item.parent.key === parentNodes[i].key){
                        return true;
                    }
                }
                return false;
            })

            nodesFiltered.map(node=>{candidateNode(node)})
            await sleep(2)


            let k1 = getRandomInt(nodesFiltered.length)
            let k2 = getRandomInt(nodesFiltered.length)
            while (k2 === k1){
                k2 = getRandomInt(nodesFiltered.length)
            }
            console.log(k1, k2)
            confirmNode(nodesFiltered[k1])
            confirmNode(nodesFiltered[k2])

            parentNodes.push(nodesFiltered[k1])
            parentNodes.push(nodesFiltered[k2])

            await sleep(2)
        }

    }

    const compare = (item1, item2)=>{
        return item2.phi_sample_shift - item1.phi_sample_shift
    }
    const  doSample = async ()=>{
        // choose root
        confirmNode(tree.root)
        await sleep(2)

        let parentNodes = [tree.root]

        for (let i = 1; i < tree.sequenceLength+1; i++){

            let nodes = []

            for (let j = 0; j < parentNodes.length; j++){
                let z = -9999
                const parentNode = parentNodes[j]
                const g_phi_s = Math.log(parentNode.value.prob) + sampleFromGumbel()

                for (let k = 0; k < parentNode.children.length; k++){
                    nodes.push(parentNode.children[k])
                    const child_phi_sample = Math.log(parentNode.children[k].value.prob) + sampleFromGumbel()
                    if (child_phi_sample > z){
                        z = child_phi_sample
                    }
                    parentNode.children[k].phi_sample = child_phi_sample
                }

                // shift
                for (let k = 0; k < parentNode.children.length; k++){
                    parentNode.children[k].phi_sample_shift = -Math.log( Math.exp(-g_phi_s) - Math.exp(-z) + Math.exp(-parentNode.children[k].phi_sample))
                }
            }

            nodes.map(node=>candidateNode(node))
            await sleep(2)

            const top2 = nodes.sort(compare).slice(0,2)


            confirmNode(top2[0])
            confirmNode(top2[1])

            parentNodes = []
            parentNodes.push(top2[0])
            parentNodes.push(top2[1])

            await sleep(2)
        }

    }


    return (
        <div>
            <div>
                <h1>
                    Stochastic Beam Search
                </h1>
                <button onClick={doSample}>Sampling</button>
            </div>
            <div id={"canvas"}>

            </div>

        </div>
    )
}

export  default  Circle;