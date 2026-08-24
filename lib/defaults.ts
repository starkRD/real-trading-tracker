import {Position} from "./types";
export const startingCapital=300000;
export const sourceSnapshot={
  activeInvestment:283291.17,
  currentValue:277077.30,
  profit:45115.45,
  loss:49982.32,
  netProfit:-4866.87,
  pnlPct:-1.6223
};
export const defaultPositions:Position[]=[
 {ticker:"NIFTYBEES",strategy:"7Bar Swing",qty:524,avgBuy:289.2427,invested:151363.20,avgSell:null,booked:0,cmp:275.90,value:144571.60,running:-6791.60,runningPct:-4.4845},
 {ticker:"LAURUSLABS",strategy:"7Bar Swing",qty:7,avgBuy:1557,invested:10899,avgSell:null,booked:12518.17,cmp:1805.60,value:12639.20,running:1740.20,runningPct:15.966},
 {ticker:"SYRMA",strategy:"7Bar Swing",qty:10,avgBuy:1488.25,invested:14882.50,avgSell:null,booked:0,cmp:1455.80,value:14558,running:-324.50,runningPct:-2.18},
 {ticker:"KTKBANK",strategy:"7Bar Swing",qty:62,avgBuy:317,invested:19654,avgSell:null,booked:0,cmp:330.20,value:20472.40,running:818.40,runningPct:4.164},
 {ticker:"SANSERA",strategy:"7Bar Swing",qty:4,avgBuy:3986.50,invested:15946,avgSell:null,booked:0,cmp:3885,value:15540,running:-406,runningPct:-2.546},
 {ticker:"SAILIFE",strategy:"7Bar Swing",qty:10,avgBuy:1480,invested:14800,avgSell:null,booked:0,cmp:1448.20,value:14482,running:-318,runningPct:-2.149},
 {ticker:"SENORES",strategy:"7Bar Swing",qty:10,avgBuy:1569.50,invested:15695,avgSell:null,booked:0,cmp:1571.90,value:15719,running:24,runningPct:.153},
 {ticker:"AKUMS",strategy:"7Bar Swing",qty:26,avgBuy:777.96,invested:20226.96,avgSell:null,booked:0,cmp:773,value:20098,running:-128.96,runningPct:-.638},
 {ticker:"ENTERO",strategy:"7Bar Swing",qty:10,avgBuy:1504.88,invested:15048.80,avgSell:null,booked:0,cmp:1520.20,value:15202,running:153.20,runningPct:1.018}
];