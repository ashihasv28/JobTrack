
package com.jobtrack.jobtrack.repository;

import com.jobtrack.jobtrack.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
}
