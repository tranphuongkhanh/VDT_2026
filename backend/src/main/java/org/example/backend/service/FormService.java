package org.example.backend.service;

import org.example.backend.dto.request.CreateFormRequest;
import org.example.backend.dto.response.FormResponse;
import org.example.backend.entity.Form;
import org.example.backend.entity.RequestType;
import org.example.backend.entity.User;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.FormRepository;
import org.example.backend.repository.RequestTypeRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FormService {

    private final FormRepository formRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final UserRepository userRepository;

    public FormService(
            FormRepository formRepository,
            RequestTypeRepository requestTypeRepository,
            UserRepository userRepository) {
        this.formRepository = formRepository;
        this.requestTypeRepository = requestTypeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public FormResponse getActiveFormByRequestTypeId(Long requestTypeId) {
        if (!requestTypeRepository.existsById(requestTypeId)) {
            throw new ResourceNotFoundException("Request type not found with id: " + requestTypeId);
        }
        Form form = formRepository.findByRequestTypeIdAndIsActiveTrue(requestTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Active form not found for request type id: " + requestTypeId));
        return convertToResponse(form);
    }

    @Transactional(readOnly = true)
    public FormResponse getFormById(Long id) {
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found with id: " + id));
        return convertToResponse(form);
    }

    @Transactional
    public FormResponse createForm(Long requestTypeId, CreateFormRequest request, String username) {
        RequestType requestType = requestTypeRepository.findById(requestTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Request type not found with id: " + requestTypeId));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        List<Form> existingForms = formRepository.findByRequestTypeId(requestTypeId);
        int nextVersion = existingForms.stream()
                .mapToInt(Form::getVersion)
                .max()
                .orElse(0) + 1;

        formRepository.findByRequestTypeIdAndIsActiveTrue(requestTypeId)
                .ifPresent(activeForm -> {
                    activeForm.setIsActive(false);
                    formRepository.saveAndFlush(activeForm);
                });

        Form form = Form.builder()
                .requestType(requestType)
                .name(request.getName().trim())
                .version(nextVersion)
                .schemaData(request.getSchemaData())
                .isActive(true) // Active by default
                .createdBy(currentUser)
                .createdAt(LocalDateTime.now())
                .build();

        Form saved = formRepository.save(form);
        return convertToResponse(saved);
    }

    @Transactional
    public FormResponse activateForm(Long id) {
        Form targetForm = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found with id: " + id));

        if (targetForm.getIsActive()) {
            return convertToResponse(targetForm); // Already active
        }

        // Deactivate currently active form(s) for the same request type
        Long requestTypeId = targetForm.getRequestType().getId();
        formRepository.findByRequestTypeIdAndIsActiveTrue(requestTypeId)
                .ifPresent(activeForm -> {
                    activeForm.setIsActive(false);
                    formRepository.saveAndFlush(activeForm);
                });

        targetForm.setIsActive(true);
        Form saved = formRepository.save(targetForm);
        return convertToResponse(saved);
    }

    private FormResponse convertToResponse(Form form) {
        return FormResponse.builder()
                .id(form.getId())
                .requestTypeId(form.getRequestType().getId())
                .name(form.getName())
                .version(form.getVersion())
                .schemaData(form.getSchemaData())
                .isActive(form.getIsActive())
                .createdByUsername(form.getCreatedBy() != null ? form.getCreatedBy().getUsername() : null)
                .createdAt(form.getCreatedAt())
                .build();
    }
}
