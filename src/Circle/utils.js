import {data3} from "./data";

export const getRandomInt=(max=100)=> {
    return Math.floor(Math.random() * max);
}

export const sleep=(seconds)=> {
    return new Promise(resolve => setTimeout(resolve, seconds*1000));
}


export const sampleFromGumbel = ()=>{
    const u = Math.random()
    return -Math.log(-Math.log(u))
}

export const sampleFromCategoricalByGumbel=(logProb)=>{
    let maxIndex = 0;
    let maxValue = -99999;
    for(let i = 0; i < logProb.length; i++){
        const p = logProb[i]
        const g = sampleFromGumbel()
        const perturbedP = p + g
        if (perturbedP > maxValue){
            maxValue = perturbedP
            maxIndex = i
        }
    }
    return maxIndex
}

export const getCategoricalDistribution = ()=>{
    const index = getRandomInt()
    return data3[index]
}