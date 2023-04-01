import { getRandomInt } from "./random";
import { ValidChar, isValidChar } from "./validChar";
import MersenneTwister from "mersenne-twister";

const NUMBER_OF_CHARS = 200;

export const rivalRandomChars: { [K in string]: ValidChar[] } = {};

// メルセンヌ・ツイスタ
// https://www.npmjs.com/package/mersenne-twister
const generator = new MersenneTwister(17);
function mt(min: number, max: number): number {
    return Math.floor(generator.random_int31() / ((2 ** 31 - 1) / max + min) + min);
}
rivalRandomChars["メルセンヌ・ツイスタ"] = [...Array(NUMBER_OF_CHARS)].map(() => {
    const index: number = mt(0, ValidChar.length - 1);
    return ValidChar[index];
});

// 線形合同法（Park & Miller）
let LCGSeeed = 271851;
function LCG(min: number, max: number): number {
    LCGSeeed = (48_271 * LCGSeeed) % (2 ** 31 - 1);
    return Math.floor(LCGSeeed / ((2 ** 31 - 1) / max + min) + min);
}

rivalRandomChars["線形合同法"] = [...Array(NUMBER_OF_CHARS)].map(() => {
    const index: number = LCG(0, ValidChar.length - 1);
    return ValidChar[index];
});

// 平方採中法
let middleSquareSeed = 621217;
function middleSquare(min: number, max: number): number {
    const sqrt = (middleSquareSeed ** 2).toString().padStart(12, "0");
    middleSquareSeed = Number(sqrt.slice(3, 9));
    return Math.floor((middleSquareSeed & 0xffff) / ((0xffff - 1) / max + min) + min);
}

rivalRandomChars["平方採中法"] = [...Array(NUMBER_OF_CHARS)].map(() => {
    const index: number = middleSquare(0, ValidChar.length - 1);
    return ValidChar[index];
});

// 猿
// https://en.wikipedia.org/wiki/Monkey of Monkey
const monkeyDescription = `Monkey is a common name that may refer to most mammals of the infraorder Simiiformes, also known as the simians. Traditionally, all animals in the group now known as simians are counted as monkeys except the apes, which constitutes an incomplete paraphyletic grouping; however, in the broader sense based on cladistics, apes (Hominoidea) are also included, making the terms monkeys and simians synonyms in regards to their scope.[citation needed][3]
In 1812, Geoffroy grouped the apes and the Cercopithecidae group of monkeys together and established the name Catarrhini, "Old World monkeys", ("singes de l'Ancien Monde" in French).[3][4][5] The extant sister of the Catarrhini in the monkey ("singes") group is the Platyrrhini (New World monkeys).[3] Some nine million years before the divergence between the Cercopithecidae and the apes,[6] the Platyrrhini emerged within "monkeys" by migration to South America from Afro-Arabia (the Old World),[citation needed][7][8] likely by ocean.[9][10][better source needed] Apes are thus deep in the tree of extant and extinct monkeys, and any of the apes is distinctly closer related to the Cercopithecidae than the Platyrrhini are.
Many monkey species are tree-dwelling (arboreal), although there are species that live primarily on the ground, such as baboons. Most species are mainly active during the day (diurnal). Monkeys are generally considered to be intelligent, especially the Old World monkeys.
Within suborder Haplorhini, the simians are a sister group to the tarsiers – the two members diverged some 70 million years ago.[11] New World monkeys and catarrhine monkeys emerged within the simians roughly 35 million years ago. Old World monkeys and apes emerged within the catarrhine monkeys about 25 million years ago. Extinct basal simians such as Aegyptopithecus or Parapithecus (35–32 million years ago) are also considered monkeys by primatologists.[12][9][13][14][15][16]
Lemurs, lorises, and galagos are not monkeys, but strepsirrhine primates (suborder Strepsirrhini). The simians' sister group, the tarsiers, are also haplorhine primates; however, they are also not monkeys.
Apes emerged within monkeys as sister of the Cercopithecidae in the Catarrhini, so cladistically they are monkeys as well. However, there has been resistance to directly designate apes (and thus humans) as monkeys, so "Old World monkey" may be taken to mean either the Cercopithecoidea (not including apes) or the Catarrhini (including apes).[17][18][19][20][21][22][23][24][25] That apes are monkeys was already realized by Georges-Louis Leclerc, Comte de Buffon in the 18th century.[26] Linnaeus placed this group in 1758 together with the tarsiers, in a single genus "Simia" (sans Homo), an ensemble now recognised as the Haplorhini.[27]
Monkeys, including apes, can be distinguished from other primates by having only two pectoral nipples, a pendulous penis, and a lack of sensory whiskers`
    .toLowerCase()
    .replace(/[^0-9a-z]/g, "");
let monkeyI = 0;
rivalRandomChars["猿"] = [...Array(NUMBER_OF_CHARS)].map(() => {
    while (true) {
        const c = monkeyDescription[monkeyI];
        monkeyI++;
        if (monkeyI >= monkeyDescription.length) {
            monkeyI = 0;
        }

        if (isValidChar(c)) {
            return c;
        }
    }
});

// 円周率
// http://www.suguru.jp/learn/pi.html
const pi = btoa(
    `  
  3.1415926535 8979323846 2643383279 5028841971 6939937510
    5820974944 5923078164 0628620899 8628034825 3421170679
    8214808651 3282306647 0938446095 5058223172 5359408128
    4811174502 8410270193 8521105559 6446229489 5493038196
    4428810975 6659334461 2847564823 3786783165 2712019091
    4564856692 3460348610 4543266482 1339360726 0249141273
    7245870066 0631558817 4881520920 9628292540 9171536436
    7892590360 0113305305 4882046652 1384146951 9415116094
    3305727036 5759591953 0921861173 8193261179 3105118548
    0744623799 6274956735 1885752724 8912279381 8301194912
    9833673362 4406566430 8602139494 6395224737 1907021798
    6094370277 0539217176 2931767523 8467481846 7669405132
    0005681271 4526356082 7785771342 7577896091 7363717872
    1468440901 2249534301 4654958537 1050792279 6892589235
    4201995611 2129021960 8640344181 5981362977 4771309960
    5187072113 4999999837 2978049951 0597317328 1609631859
    5024459455 3469083026 4252230825 3344685035 2619311881
    7101000313 7838752886 5875332083 8142061717 7669147303
    5982534904 2875546873 1159562863 8823537875 9375195778
    1857780532 1712268066 1300192787 6611195909 2164201989
  
    3809525720 1065485863 2788659361 5338182796 8230301952
    0353018529 6899577362 2599413891 2497217752 8347913151
    5574857242 4541506959 5082953311 6861727855 8890750983
    8175463746 4939319255 0604009277 0167113900 9848824012
    8583616035 6370766010 4710181942 9555961989 4676783744
    9448255379 7747268471 0404753464 6208046684 2590694912
    9331367702 8989152104 7521620569 6602405803 8150193511
    2533824300 3558764024 7496473263 9141992726 0426992279
    6782354781 6360093417 2164121992 4586315030 2861829745
    5570674983 8505494588 5869269956 9092721079 7509302955
    3211653449 8720275596 0236480665 4991198818 3479775356
    6369807426 5425278625 5181841757 4672890977 7727938000
    8164706001 6145249192 1732172147 7235014144 1973568548
    1613611573 5255213347 5741849468 4385233239 0739414333
    4547762416 8625189835 6948556209 9219222184 2725502542
    5688767179 0494601653 4668049886 2723279178 6085784383
    8279679766 8145410095 3883786360 9506800642 2512520511
    7392984896 0841284886 2694560424 1965285022 2106611863
    0674427862 2039194945 0471237137 8696095636 4371917287
    4677646575 7396241389 0865832645 9958133904 7802759009
  
    9465764078 9512694683 9835259570 9825822620 5224894077
    2671947826 8482601476 9909026401 3639443745 5305068203
    4962524517 4939965143 1429809190 6592509372 2169646151
    5709858387 4105978859 5977297549 8930161753 9284681382
    6868386894 2774155991 8559252459 5395943104 9972524680
    8459872736 4469584865 3836736222 6260991246 0805124388
    4390451244 1365497627 8079771569 1435997700 1296160894
    4169486855 5848406353 4220722258 2848864815 8456028506
    0168427394 5226746767 8895252138 5225499546 6672782398
    6456596116 3548862305 7745649803 5593634568 1743241125
    1507606947 9451096596 0940252288 7971089314 5669136867
    2287489405 6010150330 8617928680 9208747609 1782493858
    9009714909 6759852613 6554978189 3129784821 6829989487
    2265880485 7564014270 4775551323 7964145152 3746234364
    5428584447 9526586782 1051141354 7357395231 1342716610
    2135969536 2314429524 8493718711 0145765403 5902799344
    0374200731 0578539062 1983874478 0847848968 3321445713
    8687519435 0643021845 3191048481 0053706146 8067491927
    8191197939 9520614196 6342875444 0643745123 7181921799
    9839101591 9561814675 1426912397 4894090718 6494231961
`.replace(/\s/g, "")
).replace(/[^0-9a-z]/g, "");
let piI = 0;
rivalRandomChars["円周率"] = [...Array(NUMBER_OF_CHARS)].map(() => {
    while (true) {
        const c = pi[piI];
        piI++;
        if (piI >= pi.length) {
            piI = 0;
        }

        if (isValidChar(c)) {
            return c;
        }
    }
});
