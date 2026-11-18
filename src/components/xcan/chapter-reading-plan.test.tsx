import React, {createRef} from 'react';
import {act,fireEvent,render,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {ChapterReadingPlan,type ChapterProgressHandle} from './chapter-reading-plan';
import {koreanBibleVideos} from '@/lib/xcan/bible-reading';
const key='xcan:chapter-progress:v1';
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();});
afterEach(()=>{cleanup();vi.useRealTimers();});
function setup(){ const ref=createRef<ChapterProgressHandle>();render(<ChapterReadingPlan ref={ref} visible currentBook="창세기" legacyCount={7}/>);act(()=>vi.runOnlyPendingTimers());return ref;}
describe('chapter reading progress',()=>{
 it('preserves legacy record without inventing video or reading completion',()=>{
  localStorage.setItem('xcan:progress:korean_bible_reading',JSON.stringify({completedDays:[1,2],seconds:90}));
  setup();expect(screen.getByText(/영상 재생 0\/1189장/)).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('xcan:progress:korean_bible_reading')!).seconds).toBe(90);
 });
 it('supports manual reading, undo, repeated clicks and reload persistence',()=>{
  setup();const button=screen.getByRole('button',{name:'창세기 1장 직접 읽음'});
  fireEvent.click(button);expect(button.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByText('마지막 수동 변경 되돌리기'));expect(button.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(button);cleanup();setup();expect(screen.getByRole('button',{name:'창세기 1장 직접 읽음'}).getAttribute('aria-pressed')).toBe('true');
 });
 it('does not count ending alone, distinguishes video from manually read chapters, permits correction',()=>{
  const ref=setup();act(()=>expect(ref.current!.finish(koreanBibleVideos[0],100)).toBe(false));
  const id=koreanBibleVideos[0].videoId!;
  cleanup();localStorage.setItem(key,JSON.stringify({videoCompleted:[],manualRead:[],excludedVideo:[],coverage:{[id]:[[0,96]]}}));
  const ref2=setup();act(()=>expect(ref2.current!.finish(koreanBibleVideos[0],100)).toBe(true));
  expect(screen.getByText(/영상 재생 4\/1189장 · 직접 읽음 0\/1189장/)).toBeTruthy();
  fireEvent.click(screen.getAllByText('영상 표시 취소')[0]);expect(screen.getByText(/영상 재생 3\/1189장/)).toBeTruthy();
  fireEvent.click(screen.getByText('영상 표시 복구'));expect(screen.getByText(/영상 재생 4\/1189장/)).toBeTruthy();
 });
 it('marks all books in a multi-book video',()=>{
  const video=koreanBibleVideos.find(v=>v.day===351)!;
  localStorage.setItem(key,JSON.stringify({coverage:{[video.videoId!]:[[0,99]]}}));
  const ref=setup();act(()=>ref.current!.finish(video,100));
  const saved=JSON.parse(localStorage.getItem(key)!);expect(saved.videoCompleted).toEqual(['디도서:1','디도서:2','디도서:3','빌레몬서:1']);
 });
});
