import { lzCompression } from './StringContracts'
import { NS } from '@ns';
import { Mock } from 'moq.ts';

// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.mock("shared/logging", () => { return { logging: { info: () => { } } } })


describe("lzCompression", () => {

    it('should handle lz compression', () => {

        const ns: NS = new Mock<NS>().object()

        const testData = [
            ["abracadabra", ["7abracad47"]],
            ["mississippi", ["4miss433ppi"]],
            ["aAAaAAaAaAA", ["3aAA53035"]],
            ["2718281828", ["627182844"]],
            ["abcdefghijk", ["9abcdefghi02jk"]],
            ["aaaaaaaaaaaa", ["3aaa91"]],
            ["aaaaaaaaaaaaa", ["1a91031"]],
            ["aaaaaaaaaaaaaa", ["1a91041"]],
        ]
        testData.forEach(test => {
            expect(lzCompression(ns, test[0])).toBe(test[1])
        })

    })
})