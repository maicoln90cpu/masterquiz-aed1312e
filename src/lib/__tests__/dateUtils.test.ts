import { describe, it, expect } from "vitest";
import {
  format,
  formatDate,
  formatDateTime,
  formatISODate,
  parseISO,
  toDate,
  diffInDays,
  isValidDate,
  relativeFromNow,
  now,
  nowISO,
} from "../dateUtils";

describe("dateUtils", () => {
  it("formatDate formata ISO em pt-BR (dd/MM/yyyy)", () => {
    expect(formatDate("2026-04-22T10:00:00Z")).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });

  it("formatDate retorna fallback para entrada inválida/null", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("não-é-data")).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("formatDateTime inclui horário", () => {
    expect(formatDateTime("2026-04-22T15:30:00Z")).toMatch(/\d{2}\/\d{2}\/2026 \d{2}:\d{2}/);
  });

  it("formatISODate retorna YYYY-MM-DD", () => {
    expect(formatISODate("2026-04-22T10:00:00Z")).toBe("2026-04-22");
  });

  it("parseISO retorna null para entrada inválida (não lança)", () => {
    expect(parseISO("invalid")).toBeNull();
    expect(parseISO(null)).toBeNull();
    expect(parseISO(undefined)).toBeNull();
  });

  it("toDate aceita Date, ISO e number (epoch)", () => {
    const d = new Date("2026-04-22T10:00:00Z");
    expect(toDate(d)).toBeInstanceOf(Date);
    expect(toDate("2026-04-22T10:00:00Z")).toBeInstanceOf(Date);
    expect(toDate(d.getTime())).toBeInstanceOf(Date);
    expect(toDate(null)).toBeNull();
  });

  it("diffInDays calcula diferença correta", () => {
    expect(diffInDays("2026-04-20T00:00:00Z", "2026-04-22T00:00:00Z")).toBe(2);
    expect(diffInDays(null, "2026-04-22T00:00:00Z")).toBe(0);
  });

  it("isValidDate identifica Date válida vs Invalid Date", () => {
    expect(isValidDate(new Date("2026-04-22"))).toBe(true);
    expect(isValidDate(new Date("xx"))).toBe(false);
    expect(isValidDate("2026-04-22")).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it("relativeFromNow devolve string com prefixo 'há' / 'em'", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString();
    const future = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
    expect(relativeFromNow(past)).toMatch(/^há /);
    expect(relativeFromNow(future)).toMatch(/^em /);
    expect(relativeFromNow(null)).toBe("—");
  });

  it("now() e nowISO() devolvem clock atual", () => {
    expect(now()).toBeInstanceOf(Date);
    expect(nowISO()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("format aceita pattern customizado", () => {
    expect(format("2026-04-22T10:00:00Z", "yyyy")).toBe("2026");
  });
});