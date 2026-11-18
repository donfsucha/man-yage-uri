import {describe,it,expect} from 'vitest';
import {mergeCoverage,coverageRatio,acceptedPlaybackSegment} from './viewing-coverage';
describe('viewing coverage',()=>{
 it('unions replayed intervals without double credit',()=>expect(mergeCoverage([[0,10],[20,30]],5,25)).toEqual([[0,30]]));
 it('does not award skipped sections or long background gaps',()=>{
  expect(acceptedPlaybackSegment({seconds:1,at:1000,rate:1},99,2000,1)).toBeNull();
  expect(acceptedPlaybackSegment({seconds:1,at:1000,rate:1},11,11000,1)).toBeNull();
 });
 it('supports speed changes and rejects backwards seeking',()=>{
  expect(acceptedPlaybackSegment({seconds:1,at:1000,rate:2},3,2000,2)).toEqual([1,3]);
  expect(acceptedPlaybackSegment({seconds:3,at:1000,rate:1},1,2000,1)).toBeNull();
 });
 it('requires actual coverage, not merely reaching the end',()=>{
  expect(coverageRatio([[95,100]],100)).toBe(.05);
  expect(coverageRatio([[0,95]],100)).toBe(.95);
  expect(coverageRatio([],0)).toBe(0);
 });
});
