import {data1, data2, data3} from "./data";
import {getRandomInt} from "./utils";

class Node {
    constructor(key, value, parent=null, xPosition=0, yPosition=0, beam="") {
        this.key = key
        this.value = value
        this.parent = parent
        this.children = []
        this.xPosition = xPosition
        this.yPosition = yPosition
        this.beam = beam
    }
}

class Tree{
    constructor(vocabulary, sequenceLength) {
        this.vocabulary = vocabulary;
        this.sequenceLength = sequenceLength;


        if(this.vocabulary.length == 2){
            this.probablityData = data2
        }else if(this.vocabulary.length == 3){
            this.probablityData = data3
        }

        let key = 0;
        this.root = new Node(key, {prob: 1.0, level: 0})
        let leafNodes = [this.root]
        for (let i = 0; i < this.sequenceLength; i++){
            let newLeafNodes = []

            for(let j = 0; j < leafNodes.length; j++){
                let leafNode = leafNodes[j]
                const randomIndex = getRandomInt();
                const distribution = this.probablityData[randomIndex]
                for(let k = 0; k < this.vocabulary.length; k++){
                    key = key + 1
                    const prob = distribution[k] * leafNode.value.prob
                    const node = new Node(key, {prob: prob, level: i+1}, leafNode, 0, 0, leafNode.beam + this.vocabulary[k])
                    leafNode.children.push(node)
                    newLeafNodes.push(node)
                }
            }
            leafNodes = [...newLeafNodes]
        }
    }

    getNodesByLevel(node, visited, level){
        let nodes = []

        if (level === 0){
            nodes.push(node)
            return  nodes
        }

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
            const out = this.getNodesByLevel(child, visited, level)
            nodes = [...nodes, ...out]
        }
        return nodes
    }


}

export const tree = new Tree(["a", "b", "c"], 3)
export default Tree;