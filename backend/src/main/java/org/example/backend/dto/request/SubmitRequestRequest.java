package org.example.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitRequestRequest {

    // Ghi chú bổ sung khi submit (tùy chọn, ghi đè note của request)
    private String note;
}
