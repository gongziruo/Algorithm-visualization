import {useEffect, useState} from "react";
import * as d3 from "d3";
import {
    getCategoricalDistribution,
    getRandomInt,
    sampleFromCategoricalByGumbel,
    sampleFromGumbel,
    sleep
} from "./utils";
import Tree from "./Node";
import {Button, Card, Col, Divider, Form, InputNumber, Row, Select} from "antd";
import * as echarts from 'echarts';

const StochasticBeamSearch = ()=>{

    let svg;
    const radius = 18;
    const margin = 40;
    const stepHeight = 120;

    const [state, setState] = useState({vocabulary: ["a", "b"], sequenceLength: 2})
    const [categoricalDistribution, setCategoricalDistribution] = useState(getCategoricalDistribution)
    const [samplingNumber, setSamplingNumber] = useState(10000)

    const categoricalChartOptions = {
        title: {
            text: 'Sample from Categorical Distribution by Gumbel Max Trick',
            left: "center",
            textStyle: {
                fontSize: '12',
            },
        },
        tooltip: {},
        xAxis: {
            data: ['a', 'b', 'c']
        },
        yAxis: {},
        series: [
            {
                name: 'sales',
                type: 'bar',
                data: []
            }
        ]
    }

    const beamChartOptions = {
        title: {
            text: 'Sampling top-1 sequence 10000 times',
            left: "center",
            textStyle: {
                fontSize: '12',
            },
        },
        tooltip: {},
        xAxis: {
            data: ['a', 'b', 'c']
        },
        yAxis: {},
        series: [
            {
                name: 'sales',
                type: 'bar',
                data: []
            }
        ]
    }



    let tree = new Tree(state.vocabulary, state.sequenceLength)
    const calculateSvgWidthAndHeight = ()=>{
        const {sequenceLength} = state
        const leafCounts = Math.pow(state.vocabulary.length, sequenceLength)
        const svgWith = margin * 2 + radius * 2 * leafCounts + margin * (leafCounts - 1)

        const svgHeight = margin * 2 + radius * 2 * (sequenceLength + 1) + sequenceLength * stepHeight
        return [svgWith, svgHeight]
    }

    const drawCircle = (x, y, prob, beam="")=>{
        svg.append('circle').attr('cx', x).attr('cy', y).attr('r', radius).attr('stroke', 'gray').attr('fill', "gray");
        svg.append("text").attr("x", x).attr("y", y)
            .attr("dx", -11)
            .attr("dy", 4)
            .style("font", "14px times")
            .style("font-weight", "normal")
            .text((prob).toFixed(2));

        svg.append("text").attr("x", x).attr("y", y).attr("stroke", "gray")
            .attr("dx", -8)
            .attr("dy", radius+15)
            .style("font-family", "'Comic Sans MS', 'Papyrus', sans-serif")
            .style("font-size", "16px")
            .style("letter-spacing", "2")
            .text(beam);
    }

    const drawCircleWithBg = (x, y, prob, bg)=>{
        svg.append('circle').attr('cx', x).attr('cy', y).attr('r', radius).attr('stroke', 'gray').attr('fill', bg);
        svg.append("text").attr("x", x-8).attr("y", y+3).attr("stroke", "black").style("font", "10px times").text((prob).toFixed(2));
    }

    const drawLine = (x1, y1, x2, y2)=>{
        svg.append('line').attr("x1", x1).attr("y1", y1+radius).attr("x2", x2).attr("y2", y2-radius).attr("stroke", "gray").attr("strokeWidth", 2)
    }

    const draw = ()=>{
        const {sequenceLength} = state
        const [width, height] = calculateSvgWidthAndHeight()
        d3.select("#svg").remove();

        if(svg !== null){
            svg = d3.select("#canvas").append("svg").attr("width", width).attr("height", height).attr("id", "svg") // .style("border", "1px solid black");
        }




        // calculate the position of leaves
        const leaves = tree.getNodesByLevel(tree.root, [], sequenceLength)
        for(let j = 0; j < leaves.length; j++){
            const node = leaves[j]
            node.xPosition = margin + 2 * radius * j + margin * j
            node.yPosition = margin + 2 * radius * sequenceLength + stepHeight * sequenceLength
            drawCircle(node.xPosition, node.yPosition, node.value.prob, node.beam)
        }

        // calculate the position of internal nodes
        for(let i = sequenceLength-1; i >= 0; i--){
            const nodes = tree.getNodesByLevel(tree.root, [], i)
            for(let j = 0; j < nodes.length; j++){
                const node = nodes[j]
                const children = node.children
                const left = children[0]
                const right = children[children.length-1]
                node.xPosition = (left.xPosition + right.xPosition)/2
                node.yPosition = left.yPosition - stepHeight - radius
                drawElement(node)
            }
        }
    }


    const drawElement = (node)=>{
        drawCircle(node.xPosition, node.yPosition, node.value.prob, node.beam)
        const children = node.children
        for(let i = 0; i < children.length; i++){
            const child = children[i]
            drawLine(node.xPosition, node.yPosition, child.xPosition, child.yPosition)
        }
    }

    useEffect(()=>{
        initChart()
        tree = new Tree(state.vocabulary, state.sequenceLength)
        draw()

        // const beamChart = echarts.init(document.getElementById('beamChart'));
        // beamChart.setOption(
        //     {
        //         ...beamChartOptions,
        //     })
        drawBeamChartChart()
    }, [state])

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
            const nodes = tree.getNodesByLevel(tree.root, [], i)

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

    const  doSampleTop1 = ()=>{
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

            const top2 = nodes.sort(compare).slice(0,2)

            parentNodes = []
            parentNodes.push(top2[0])
        }

        return parentNodes[0]
    }

    const [form] = Form.useForm();
    const { Option } = Select;

    const formChange = ()=>{
        const vocabulary = form.getFieldValue("vocabulary")
        const sequenceLength = form.getFieldValue("sequenceLength")
        const vocabularyArr = vocabulary.split(",")
        setState({...state, vocabulary: vocabularyArr, sequenceLength})
    }

    const reset = ()=>{
        draw()
    }

    const [categoricalForm] = Form.useForm();

    const resetGumbelSampling = ()=>{
        setCategoricalDistribution(getCategoricalDistribution())
        resetChart()
        draw()
    }

    const doGumbelSampling = async ()=>{
        const sampleNumbers = categoricalForm.getFieldValue("sampleNumbers")
        await setSamplingNumber(sampleNumbers)
        initChart()
        draw()
    }
    const resetChart = ()=>{
        const myChart = echarts.init(document.getElementById('chart'));
        myChart.setOption(categoricalChartOptions);
    }
    const initChart = ()=>{
        const myChart = echarts.init(document.getElementById('chart'));

        let sampleData =[0, 0, 0]
        const logProb = [Math.log(categoricalDistribution[0]), Math.log(categoricalDistribution[1]), Math.log(categoricalDistribution[2])]
        for (let i = 0; i < samplingNumber; i++){
            const s = sampleFromCategoricalByGumbel(logProb)
            sampleData[s] = sampleData[s] + 1
        }
        const totalCount = sampleData.reduce((a, b) => a + b)
        sampleData = sampleData.map(item=>item/totalCount)

        myChart.setOption({...categoricalChartOptions, series: [
                {
                    name: 'sales',
                    type: 'bar',
                    data: sampleData
                }
            ]});
    }

    const drawBeamChartChart = ()=>{

        let sampleData = new Array(Math.pow(state.vocabulary.length, state.sequenceLength)).fill(0);
        const startIndex = 1 * (1 - Math.pow(state.vocabulary.length, state.sequenceLength))/(1 - state.vocabulary.length)
        for(let i = 0; i < 10000; i++){
            const node = doSampleTop1()
            sampleData[node.key - startIndex] = sampleData[node.key - startIndex] + 1
        }

        const totalCount = sampleData.reduce((a, b) => a + b)
        sampleData = sampleData.map(item=>item/totalCount)

        const leaves = tree.getNodesByLevel(tree.root, [], state.sequenceLength)
        const xAxis =  new Array(Math.pow(state.vocabulary.length, state.sequenceLength)).fill(0);
        for(let i = 0; i < xAxis.length; i++){
            xAxis[i] = leaves[i].beam
        }

        const myChart = echarts.init(document.getElementById('beamChart'));
        myChart.setOption(
            {
                ...beamChartOptions,
                series: [
                    {
                        name: 'sales',
                        type: 'bar',
                        data: sampleData
                    }],
                xAxis: {
                    data: xAxis
                },
            })
    }

    return (
        <div>
            <div style={{textAlign:"left"}}>
                <h1>
                    Stochastic Beam Search
                </h1>
            </div>

            <Card style={{textAlign:"left", }} title="Gumbel Max Trick">
                <Row>
                    <Col span={16}>
                        <Form form={categoricalForm} layout={"inline"} initialValues={{sampleNumbers: samplingNumber}}>
                            <Form.Item>categorical distribution: <b> P(a) = {categoricalDistribution[0].toFixed(2)}, P(b) = {categoricalDistribution[1].toFixed(2)}, P(c) = {categoricalDistribution[2].toFixed(2)} </b></Form.Item>
                            <Form.Item name={"sampleNumbers"} label={"sample numbers"}>
                                <InputNumber min={1}></InputNumber>
                            </Form.Item>
                        </Form>
                    </Col>
                    <Col span={8} align="right">
                        <Button type={"primary"} onClick={resetGumbelSampling}>Init Distribution</Button>
                        <Button type={"primary"} style={{marginLeft: 20}} onClick={doGumbelSampling} >Sampling</Button>
                    </Col>
                </Row>
                <div id={"chart"} style={{height: 300, width: 800, marginTop: 10}}>

                </div>
            </Card>



            <Card  style={{textAlign:"left", marginTop: 5 }} title={"Top Down Sampling"}>
                <Row>
                    <Col span={16} >
                        <h4>sample the sequence of Top 2 by top down sampling</h4>
                        <Form form={form} initialValues={{vocabulary: "a, b", sequenceLength: 2}} layout={"inline"}>
                            <Form.Item name="vocabulary" label="Vocabulary">
                                <Select onChange={formChange}>
                                    <Option value={"a,b"}>a,b</Option>
                                    <Option value={"a,b,c"}>a,b,c</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="sequenceLength" label="Sequence Length">
                                <Select onChange={formChange}>
                                    <Option value={2}>2</Option>
                                    <Option value={3}>3</Option>
                                </Select>
                            </Form.Item>
                        </Form>

                    </Col>
                    <Col span={8} align="right">
                        <Button type={"primary"} onClick={reset}>Reset</Button>
                        <Button type={"primary"} style={{marginLeft: 20}} onClick={doSample}>Top Down Sampling</Button>
                    </Col>
                </Row>



                <div id={"canvas"} style={{marginTop:20}}>

                </div>

                <Divider/>
                <div>
                    <Row>
                        <Col span={16}>
                            <h4>sample the sequence of Top 1 by top down sampling for 10000 times, the frequency should be about the same as the probability of a leaf node  </h4>
                        </Col>
                        <Col span={8} align={"right"}>
                            <Button type={"primary"} onClick={drawBeamChartChart}>Sample Top 1</Button>
                        </Col>
                    </Row>
                </div>

                <div id={"beamChart"} style={{marginTop:20, height: 400, width: 800}}>

                </div>

            </Card>

        </div>
    )
}

export  default  StochasticBeamSearch;