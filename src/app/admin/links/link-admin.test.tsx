import { fireEvent,render,screen,waitFor,cleanup } from "@testing-library/react";
import { afterEach,beforeEach,it,expect,vi } from "vitest";
import LinkAdmin from "./link-admin";
import { blankSchedule } from "@/lib/link-schedule/model";
const fetchMock=vi.fn();
beforeEach(()=>{vi.stubGlobal("fetch",fetchMock);vi.spyOn(window,"confirm").mockReturnValue(true);fetchMock.mockReset();});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const json=(body:unknown,status=200)=>Promise.resolve({ok:status<400,status,json:async()=>body});
it("loads, edits, saves, and does not claim successful storage after failure",async()=>{
 fetchMock.mockImplementation(()=>json({current:null,versions:[]}));render(<LinkAdmin/>);
 expect(screen.getByRole("button",{name:"실제 서버에 저장"}).closest("fieldset")?.disabled).toBe(true);
 fireEvent.click(screen.getByRole("button",{name:"서버에서 불러오기"}));await screen.findByText(/새 주소입니다/);
 fireEvent.click(screen.getByRole("button",{name:"+ 예약 추가"}));fireEvent.change(screen.getByLabelText("표시 이름"),{target:{value:"아침 말씀"}});
 fireEvent.click(screen.getByLabelText("시간대별 전환 사용"));
 fetchMock.mockImplementation((_url,options)=>{const {config}=JSON.parse(options.body);return json({current:{slug:"bible",config,revision:1,updated_at:"2026-11-19T00:00:00Z"}});});
 fireEvent.click(screen.getByRole("button",{name:"실제 서버에 저장"}));await screen.findByText(/서버 저장 완료/);
 expect(screen.getByRole("link",{name:/저장된 실제 연결/}).getAttribute("href")).toBe("/go/bible");
 fetchMock.mockImplementation(()=>json({error:"저장 실패 시험"},503));fireEvent.click(screen.getByRole("button",{name:"실제 서버에 저장"}));await screen.findByRole("alert");expect(screen.getByRole("alert").textContent).toContain("저장 실패 시험");expect(screen.queryByText(/서버 저장 완료/)).toBeNull();
});
it("prevents overlap, respects cancel, and locks editing when a different slug is typed",async()=>{
 fetchMock.mockImplementation(()=>json({current:{config:blankSchedule,revision:1},versions:[]}));render(<LinkAdmin/>);fireEvent.click(screen.getByRole("button",{name:"서버에서 불러오기"}));await screen.findByText(/서버 버전 1을/);
 fireEvent.click(screen.getByRole("button",{name:"+ 예약 추가"}));fireEvent.click(screen.getByRole("button",{name:"+ 예약 추가"}));expect(screen.getByRole("button",{name:"실제 서버에 저장"}).hasAttribute("disabled")).toBe(true);
 vi.mocked(window.confirm).mockReturnValue(false);fireEvent.click(screen.getAllByRole("button",{name:"제거"})[1]);expect(screen.getAllByLabelText("표시 이름")).toHaveLength(2);
 vi.mocked(window.confirm).mockReturnValue(true);fireEvent.click(screen.getAllByRole("button",{name:"제거"})[1]);expect(screen.getAllByLabelText("표시 이름")).toHaveLength(1);
 fireEvent.change(screen.getByLabelText("주소 이름"),{target:{value:"other"}});expect(screen.getByRole("button",{name:"실제 서버에 저장"}).closest("fieldset")?.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText("주소 이름"),{target:{value:"bible"}});vi.mocked(window.confirm).mockReturnValue(false);fireEvent.click(screen.getByRole("button",{name:"서버에서 불러오기"}));await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
});
