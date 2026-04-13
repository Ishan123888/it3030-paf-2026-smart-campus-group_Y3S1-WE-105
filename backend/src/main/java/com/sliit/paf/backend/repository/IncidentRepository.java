package com.sliit.paf.backend.repository;

import com.sliit.paf.backend.models.Incident;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {
    List<Incident> findByCreatedByUserIdOrderByCreatedAtDesc(String createdByUserId);
    List<Incident> findByAssignedToUserIdOrderByUpdatedAtDesc(String assignedToUserId);
}

