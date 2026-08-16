package com.fpt.seal.hms.roundranking.dto;

import java.util.List;

/**
 * Sent only when finalising a round failed because a tie sat across the promotion cut-off.
 * {@code teamIds} must name teams from that tied group, and the reason is recorded against
 * every team in it.
 */
public record TieBreakRequest(List<Long> teamIds, String reason) {
}
