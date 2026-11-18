// @vitest-environment node
import { it,expect,vi } from "vitest";
vi.mock("@/lib/link-schedule/store",()=>({loadSchedule:vi.fn()}));
import { loadSchedule } from "@/lib/link-schedule/store";
import { blankSchedule } from "@/lib/link-schedule/model";
import { GET } from "./route";
it("redirects without caching and rejects unknown/failed lookup",async()=>{
 const request=new Request("https://ifwe.cnanfc.com/go/bible");const params={params:Promise.resolve({slug:"bible"})};
 vi.mocked(loadSchedule).mockResolvedValue({slug:"bible",config:blankSchedule,revision:1,updated_at:"now"});
 const res=await GET(request,params);expect(res.status).toBe(302);expect(res.headers.get("location")).toBe("https://ifwe.cnanfc.com/b");expect(res.headers.get("cache-control")).toContain("no-store");
 vi.mocked(loadSchedule).mockResolvedValue(null);expect((await GET(request,params)).status).toBe(404);
 vi.mocked(loadSchedule).mockRejectedValue(new Error("secret"));const error=await GET(request,params);expect(error.status).toBe(503);expect(await error.text()).not.toContain("secret");
});
