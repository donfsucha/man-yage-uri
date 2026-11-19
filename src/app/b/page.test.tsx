import { act, cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import BiblePage from "./page";
const chapters=["창세기:1","창세기:2","창세기:3","창세기:4"];
beforeEach(()=>{localStorage.clear();history.replaceState(null,"","/b?openPlan=1");HTMLElement.prototype.scrollIntoView=vi.fn();});
afterEach(()=>{cleanup();delete window.AndroidBot;vi.restoreAllMocks();});
async function open(record:object={}) {
 localStorage.setItem("xcan:chapter-progress:v1",JSON.stringify(record));
 localStorage.setItem("xcan:progress:korean_bible_reading",JSON.stringify({index:0,seconds:0,completedDays:[1]}));
 const view=render(<BiblePage/>);
 await waitFor(()=>expect(view.container.querySelector("[data-watch-status]")).toBeTruthy());
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,20));});
 return view.container.querySelector("[data-watch-status]")!;
}
it.each([
 [{}, "incomplete"],
 [{manualRead:chapters}, "incomplete"],
 [{videoCompleted:chapters.slice(0,3)}, "incomplete"],
 [{videoCompleted:chapters}, "complete"],
 [{videoCompleted:chapters,excludedVideo:[chapters[0]]}, "incomplete"],
])("uses only all confirmed, non-excluded video chapters: %j",async(record,status)=>{
 const row=await open(record);
 expect(row.getAttribute("data-watch-status")).toBe(status);
 expect(row.lastElementChild?.textContent?.trim()).toBe("시작");
 expect(row.firstElementChild?.textContent?.trim()).toBe(status==="complete"?"시청 완료":"시청 미완료");
});
it("refreshes labels after correction and undo without changing manual reading",async()=>{
 const row=await open({videoCompleted:chapters});
 fireEvent.click(screen.getAllByText("영상 표시 취소")[0]);
 expect(row.getAttribute("data-watch-status")).toBe("incomplete");
 fireEvent.click(screen.getByText("마지막 수동 변경 되돌리기"));
 expect(row.getAttribute("data-watch-status")).toBe("complete");
 fireEvent.click(screen.getByRole("button",{name:"창세기 1장 직접 읽음"}));
 expect(row.getAttribute("data-watch-status")).toBe("complete");
});
it("keeps Android row DOM and grid unchanged, without web badges",async()=>{
 window.AndroidBot={} as NonNullable<typeof window.AndroidBot>;
 const view=render(<BiblePage/>);
 await waitFor(()=>expect(screen.getAllByText("시작").length).toBeGreaterThan(0));
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,20));});
 expect(view.container.querySelector("[data-watch-status]")).toBeNull();
 const row=screen.getAllByText("시작")[0].parentElement!;
 expect(row.className).toContain("grid-cols-[34px_1fr_70px]");
 expect(row.children.length).toBe(3);
});
