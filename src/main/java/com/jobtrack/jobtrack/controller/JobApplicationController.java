
package com.jobtrack.jobtrack.controller;

import com.jobtrack.jobtrack.entity.JobApplication;
import com.jobtrack.jobtrack.service.JobApplicationService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class JobApplicationController {

    private final JobApplicationService service;

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<JobApplication> getAllApplications() {
        return service.getAllApplications();
    }

    @PostMapping
    public JobApplication addApplication(@RequestBody JobApplication application) {
        return service.saveApplication(application);
    }

    @DeleteMapping("/{id}")
    public void deleteApplication(@PathVariable Long id) {
        service.deleteApplication(id);
        
    }
    
    @PutMapping("/{id}")
    public JobApplication updateApplication(
          @PathVariable Long id,
          @RequestBody JobApplication application) {

        application.setId(id);
        return service.saveApplication(application);
}
}
