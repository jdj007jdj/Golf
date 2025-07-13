without trying to finish a rount, the following errors now show up in metro: Rad  
 the @Log.md
⎿ Read Log.md (127 lines)

● I see the issue! The backend validation is rejecting null for putts. The validator  
 says "Putts must be between 0-10" but we're sending null. The backend validation  
 should allow null since putts is optional. Let me fix the backend validation:

, "id": "58941a06-5a5f-4525-b7b5-f94f4c45542a", "name": "White", "rating": null, "slope": null, "totalYards": null}], "timezone": null, "updatedAt": "2025-07-13T13:11:55.845Z", "website": null}
(NOBRIDGE) LOG Token present: true
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 5}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "ab19aeef-1110-4379-8417-16ee40d2fc1f", "putts": null, "strokes": 4}, "holeNumber": 1, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "75ad84b0-2810-4b69-ae3c-f2051fd8530e", "putts": null, "strokes": 4}, "holeNumber": 2, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "6682b475-7592-402d-a7aa-390eece245c7", "putts": null, "strokes": 4}, "holeNumber": 3, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "5e1f6f6c-6f04-420f-a3f5-e15eb25fe615", "putts": null, "strokes": 4}, "holeNumber": 4, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "3addb2e7-6626-4c77-843c-5625744b568d", "putts": null, "strokes": 5}, "holeNumber": 5, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "a79d2451-b818-4120-815c-96163b2a53a3", "putts": null, "strokes": 4}, "holeNumber": 7, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "8af06917-536e-48e0-b3fa-f38cae75f3b4", "putts": null, "strokes": 3}, "holeNumber": 8, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "6803c15e-b1bd-49cf-b847-2d75b8b3081a", "putts": null, "strokes": 4}, "holeNumber": 9, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "9e232535-bc0f-4d33-9991-4f69c7ffbcbd", "putts": null, "strokes": 4}, "holeNumber": 10, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "9b755068-37c1-4710-acc6-41ad2999de17", "putts": null, "strokes": 3}, "holeNumber": 11, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "a1838df0-0b5f-4e1e-b65f-5a7773f8363b", "putts": null, "strokes": 4}, "holeNumber": 12, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "6e34a7f2-5240-4ad1-89b1-e31cd810b603", "putts": null, "strokes": 4}, "holeNumber": 13, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "b9d1b56b-80bb-4cc8-8f32-37e83327a5f6", "putts": null, "strokes": 5}, "holeNumber": 14, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "af1992f3-c267-4389-b58e-076eeaa243b6", "putts": null, "strokes": 4}, "holeNumber": 15, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "8b87a3d3-aa6a-4bed-9c93-6358dcb016f2", "putts": null, "strokes": 4}, "holeNumber": 16, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "90dbcdc4-b527-4e0e-bd01-1bdc10e453f3", "putts": null, "strokes": 4}, "holeNumber": 17, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
(NOBRIDGE) LOG Saving score to backend: {"body": {"holeId": "d87451a2-6d54-44c8-8182-f25538ecd727", "putts": null, "strokes": 4}, "holeNumber": 18, "url": "http://192.168.0.123:3000/api/rounds/058689db-40de-4ec5-b885-22e2936989be/scores"}
(NOBRIDGE) LOG Scores saved successfully
(NOBRIDGE) ERROR Failed to save score to backend: {"errors": [{"location": "body", "msg": "Putts must be between 0-10", "path": "putts", "type": "field", "value": null}], "message": "Validation failed", "success": false}
