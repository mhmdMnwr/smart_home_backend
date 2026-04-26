// import { validate } from 'class-validator';
// import { CreateHistoryDto } from './create-history.dto';

// describe('CreateHistoryDto', () => {
//   it('should pass validation with valid data', async () => {
//     const dto = new CreateHistoryDto();
//     dto.device = 'sensor-1';
//     dto.type = 'temperature';
//     dto.value = 25.5;

//     const errors = await validate(dto);
//     expect(errors.length).toBe(0);
//   });

//   it('should fail validation when fields are missing', async () => {
//     const dto = new CreateHistoryDto();

//     const errors = await validate(dto);
//     expect(errors.length).toBeGreaterThan(0);
//     expect(errors.length).toBe(3); // device, type, and value are missing
//   });

//   it('should fail validation when types are incorrect', async () => {
//     const dto = new CreateHistoryDto();
//     // Intentionally assigning wrong types to trigger validation errors
//     dto.device = 123 as any; // Should be a string
//     dto.type = true as any; // Should be a string
//     dto.value = '25.5' as any; // Should be a number

//     const errors = await validate(dto);
//     expect(errors.length).toBe(3); 
//   });
// }); 