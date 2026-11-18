// @vitest-environment node
import { describe,it,expect,vi,beforeEach } from "vitest";
vi.mock("@/lib/link-schedule/store",()=>({loadSchedule:vi.fn(),history:vi.fn(),saveSchedule:vi.fn()}));
import { loadSchedule,history,saveSchedule } from "@/lib/link-schedule/store";
import { GET,PUT } from "./route";
import { blankSchedule } from "@/lib/link-schedule/model";
const origin="https://ifwe.cnanfc.com";
const auth=()=>`Basic ${Buffer.from("admin:test-password").toString("base64")}`;
const req=(body:unknown,headers:Record<string,string>={})=>new Request(`${origin}/admin/links/data`,{method:"PUT",headers:{authorization:auth(),origin,"content-type":"application/json",...headers},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();process.env.ADMIN_PASSWORD="test-password";});
describe("protected link API",()=>{
 it("fails closed without configured auth",async()=>{delete process.env.ADMIN_PASSWORD;expect((await GET(new Request(`${origin}/admin/links/data?slug=bible`))).status).toBe(503);});
 it("rejects unauthenticated reads and writes",async()=>{expect((await GET(new Request(`${origin}/admin/links/data?slug=bible`))).status).toBe(401);expect((await PUT(req({}, {authorization:""}))).status).toBe(401);expect(loadSchedule).not.toHaveBeenCalled();});
 it("rejects cross-site saves",async()=>{expect((await PUT(req({}, {origin:"https://evil.com"}))).status).toBe(403);expect(saveSchedule).not.toHaveBeenCalled();});
 it("distinguishes empty storage from unavailable storage",async()=>{vi.mocked(loadSchedule).mockResolvedValue(null);vi.mocked(history).mockResolvedValue([]);const response=await GET(new Request(`${origin}/admin/links/data?slug=bible`,{headers:{authorization:auth()}}));expect(response.status).toBe(200);expect((await response.json()).current).toBeNull();vi.mocked(loadSchedule).mockRejectedValue(new Error("db credentials"));expect((await GET(new Request(`${origin}/admin/links/data?slug=bible`,{headers:{authorization:auth()}}))).status).toBe(503);});
 it("validates then saves and detects stale edits",async()=>{const body={slug:"bible",revision:0,config:blankSchedule};vi.mocked(saveSchedule).mockResolvedValue({...body,updated_at:"now"});expect((await PUT(req(body))).status).toBe(200);vi.mocked(saveSchedule).mockRejectedValue(new Error("REVISION_CONFLICT"));expect((await PUT(req(body))).status).toBe(409);expect((await PUT(req({...body,config:{...blankSchedule,fallback:"javascript:alert(1)"}}))).status).toBe(400);});
});
