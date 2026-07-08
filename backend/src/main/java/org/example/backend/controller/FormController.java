package org.example.backend.controller;

import org.example.backend.dto.response.FormResponse;
import org.example.backend.service.FormService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forms")
public class FormController {

    private final FormService formService;

    public FormController(FormService formService) {
        this.formService = formService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FormResponse> getFormById(@PathVariable Long id) {
        FormResponse form = formService.getFormById(id);
        return ResponseEntity.ok(form);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FormResponse> activateForm(@PathVariable Long id) {
        FormResponse activated = formService.activateForm(id);
        return ResponseEntity.ok(activated);
    }
}
